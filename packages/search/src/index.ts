/** A text to search in. `null` and `undefined` never match. */
export type SearchText = string | null | undefined

/** What to search for. A string is split into words; an array is treated as separate words. */
export type SearchQuery = string | readonly string[]

export type SearchOptions = {
  /** Ignore diacritics, so `e` matches `é` and `a` matches `ä`, and vice versa. Default `true`. */
  ignoreDiacritics?: boolean
  /** Also match `ae`, `oe`, `ue` with `ä`, `ö`, `ü` (German spelling), and vice versa. Default `false`. */
  germanNormalization?: boolean
  /** Where a query word may match: anywhere in the text (`'any'`), or only where a word starts (`'wordStart'`). Default `'any'`. */
  matchFrom?: 'any' | 'wordStart'
}

/** A range in the original text. `end` is exclusive. */
export type SearchMatchRange = { start: number; end: number }

/** A piece of text from {@link getHighlightSegments} or {@link splitByMatchRanges}. */
export type HighlightSegment = {
  text: string
  /** The exact matched letters. */
  isMatch: boolean
  /** Inside a word that has a match, e.g. to highlight the whole word. */
  isInMatchedWord: boolean
}

type FoldMode = { spellOut: boolean; stripMarks: boolean }
type Folded = { folded: string; starts: number[]; ends: number[] }
type QueryWord = { plain: string; spelled: string | null }

const NON_WORD_CHARS = /[^\p{L}\p{N}\p{M}]+/u
const WORD_CHAR_AT_END = /[\p{L}\p{N}\p{M}]$/u
const WORDS = /[\p{L}\p{N}\p{M}]+/gu
const UNITS = /\P{M}\p{M}*|\p{M}+/gu
const MARKS = /\p{M}/gu
const UMLAUTS = /[äöü]/g
const SPELL_OUT_TRIGGER = /[äöü]|ae|oe|ue/
const SPELLED_OUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue' }

const MAX_TEXT_CACHE_SIZE = 100_000
const MAX_UNIT_CACHE_SIZE = 10_000

const modeIndex = ({ spellOut, stripMarks }: FoldMode): number => (spellOut ? 2 : 0) + (stripMarks ? 1 : 0)
const textCaches: Map<string, string>[] = [new Map(), new Map(), new Map(), new Map()]
const unitCaches: Map<string, string>[] = [new Map(), new Map(), new Map(), new Map()]

const isAscii = (text: string): boolean => {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) return false
  }
  return true
}

/** Folds one character with its combining marks: NFC, lowercase, `ß` → `ss`, optionally spell out umlauts and strip marks. */
const foldUnit = (unit: string, mode: FoldMode): string => {
  const cache = unitCaches[modeIndex(mode)] as Map<string, string>
  const cached = cache.get(unit)
  if (cached !== undefined) return cached

  let folded = unit.normalize('NFC').toLowerCase().replaceAll('ß', 'ss')
  if (mode.spellOut) folded = folded.replace(UMLAUTS, (char) => SPELLED_OUT[char] ?? char)
  if (mode.stripMarks) folded = folded.normalize('NFD').replace(MARKS, '')

  if (cache.size >= MAX_UNIT_CACHE_SIZE) cache.clear()
  cache.set(unit, folded)
  return folded
}

/**
 * Folds a text for matching. `starts[i]` and `ends[i]` are the range in the original text that folded char `i` came
 * from. A character with its combining marks is folded as one unit, so `a` + combining diaeresis folds like `ä`.
 */
const fold = (text: string, mode: FoldMode): Folded => {
  if (isAscii(text)) {
    const starts = Array.from({ length: text.length }, (_, i) => i)
    return { folded: text.toLowerCase(), starts, ends: starts.map((i) => i + 1) }
  }

  let folded = ''
  const starts: number[] = []
  const ends: number[] = []
  for (const match of text.matchAll(UNITS)) {
    const unit = match[0]
    const foldedUnit = foldUnit(unit, mode)
    folded += foldedUnit
    for (let i = 0; i < foldedUnit.length; i++) {
      starts.push(match.index)
      ends.push(match.index + unit.length)
    }
  }
  return { folded, starts, ends }
}

/** The folded text only, cached per text and fold mode. */
const foldCached = (text: string, mode: FoldMode): string => {
  if (isAscii(text)) return text.toLowerCase()

  const cache = textCaches[modeIndex(mode)] as Map<string, string>
  const cached = cache.get(text)
  if (cached !== undefined) return cached

  const { folded } = fold(text, mode)
  if (cache.size >= MAX_TEXT_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(text, folded)
  return folded
}

const getModes = (options: SearchOptions | undefined): { plain: FoldMode; spelled: FoldMode | null } => {
  const stripMarks = options?.ignoreDiacritics ?? true
  return {
    plain: { spellOut: false, stripMarks },
    spelled: (options?.germanNormalization ?? false) ? { spellOut: true, stripMarks } : null,
  }
}

const getQueryWords = (query: SearchQuery, options: SearchOptions | undefined): QueryWord[] => {
  const { plain, spelled } = getModes(options)
  const joined = typeof query === 'string' ? query : query.join(' ')
  return joined
    .split(NON_WORD_CHARS)
    .filter((word) => word !== '')
    .map((word) => ({
      plain: foldCached(word, plain),
      // Spelling out can only add a meaningful match for words with an umlaut or its spelled-out form.
      spelled:
        spelled !== null && SPELL_OUT_TRIGGER.test(foldCached(word, { spellOut: false, stripMarks: false }))
          ? foldCached(word, spelled)
          : null,
    }))
}

const isWordStartAt = (folded: string, index: number): boolean =>
  index === 0 || !WORD_CHAR_AT_END.test(folded.slice(Math.max(0, index - 2), index))

/** Index of the next occurrence of `needle` at or after `from`, only at word starts if `wordStart`; `-1` if none. */
const findFrom = (folded: string, needle: string, wordStart: boolean, from: number): number => {
  let index = folded.indexOf(needle, from)
  while (index !== -1 && wordStart && !isWordStartAt(folded, index)) {
    index = folded.indexOf(needle, index + 1)
  }
  return index
}

const mergeRanges = (ranges: readonly SearchMatchRange[], textLength: number): SearchMatchRange[] => {
  const sorted = ranges
    .map(({ start, end }) => ({ start: Math.max(0, start), end: Math.min(textLength, end) }))
    .filter(({ start, end }) => start < end)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const merged: SearchMatchRange[] = []
  for (const range of sorted) {
    const last = merged.at(-1)
    if (last !== undefined && range.start <= last.end) {
      last.end = Math.max(last.end, range.end)
    } else {
      merged.push(range)
    }
  }
  return merged
}

const matchesWords = (texts: readonly SearchText[], words: readonly QueryWord[], options?: SearchOptions): boolean => {
  const { plain, spelled } = getModes(options)
  const wordStart = options?.matchFrom === 'wordStart'

  return words.every((word) =>
    texts.some((text) => {
      if (text === null || text === undefined || text === '') return false
      if (findFrom(foldCached(text, plain), word.plain, wordStart, 0) !== -1) return true
      return (
        spelled !== null &&
        word.spelled !== null &&
        findFrom(foldCached(text, spelled), word.spelled, wordStart, 0) !== -1
      )
    }),
  )
}

/**
 * Returns whether every word of the query matches in at least one of the texts, in any order. Case is always ignored.
 * A query without words matches everything.
 *
 * @param texts - The texts to search in, e.g. several fields of one item.
 * @param query - The search query.
 * @param options - See {@link SearchOptions}.
 * @returns `true` if every query word matches.
 * @example
 * ```ts
 * import { matchesSearch } from '@kyco-utils/search'
 *
 * matchesSearch(['Renée Smith', 'Paris'], 'smith renee') // true
 * matchesSearch(['Invoice'], 'voice', { matchFrom: 'wordStart' }) // false
 * ```
 */
export const matchesSearch = (texts: readonly SearchText[], query: SearchQuery, options?: SearchOptions): boolean =>
  matchesWords(texts, getQueryWords(query, options), options)

/**
 * Returns the items where every word of the query matches in at least one of the item's texts (see
 * {@link matchesSearch}), in their original order. For a query without words, returns `items` itself, not a copy.
 *
 * @param items - The items to filter.
 * @param query - The search query.
 * @param getTexts - Returns the texts to search in for an item.
 * @param options - See {@link SearchOptions}.
 * @returns The matching items.
 * @example
 * ```ts
 * import { filterBySearch } from '@kyco-utils/search'
 *
 * const users = [
 *   { name: 'Renée Smith', city: 'Paris' },
 *   { name: 'John Smith', city: 'London' },
 *   { name: 'Jane Doe', city: 'Paris' },
 * ]
 *
 * filterBySearch(users, 'smith paris', (user) => [user.name, user.city])
 * // [{ name: 'Renée Smith', city: 'Paris' }]
 * ```
 */
export const filterBySearch = <T>(
  items: readonly T[],
  query: SearchQuery,
  getTexts: (item: T) => readonly SearchText[],
  options?: SearchOptions,
): readonly T[] => {
  const words = getQueryWords(query, options)
  if (words.length === 0) return items
  return items.filter((item) => matchesWords(getTexts(item), words, options))
}

/**
 * Returns the ranges of the original text matched by any query word, sorted and merged, for highlighting. Ranges always
 * cover whole characters, e.g. the whole `ß` when only one `s` matched.
 *
 * @param text - The text to find matches in.
 * @param query - The search query.
 * @param options - See {@link SearchOptions}. Use the same options as for filtering.
 * @returns The matched ranges, `end` exclusive. Empty for a query without words.
 * @example
 * ```ts
 * import { findMatchRanges } from '@kyco-utils/search'
 *
 * findMatchRanges('Café Royal', 'cafe') // [{ start: 0, end: 4 }]
 * findMatchRanges('Renée Smith', 'sm re') // [{ start: 0, end: 2 }, { start: 6, end: 8 }]
 * ```
 */
export const findMatchRanges = (text: string, query: SearchQuery, options?: SearchOptions): SearchMatchRange[] => {
  const words = getQueryWords(query, options)
  if (words.length === 0 || text === '') return []

  const { plain, spelled } = getModes(options)
  const wordStart = options?.matchFrom === 'wordStart'
  const ranges: SearchMatchRange[] = []
  let plainFolded: Folded | undefined
  let spelledFolded: Folded | undefined

  const collect = ({ folded, starts, ends }: Folded, needle: string) => {
    if (needle === '') return
    for (let index = findFrom(folded, needle, wordStart, 0); index !== -1; ) {
      ranges.push({ start: starts[index] ?? 0, end: ends[index + needle.length - 1] ?? text.length })
      index = findFrom(folded, needle, wordStart, index + 1)
    }
  }

  for (const word of words) {
    plainFolded ??= fold(text, plain)
    collect(plainFolded, word.plain)
    if (spelled !== null && word.spelled !== null) {
      spelledFolded ??= fold(text, spelled)
      collect(spelledFolded, word.spelled)
    }
  }

  return mergeRanges(ranges, text.length)
}

/**
 * Splits a text into segments for highlighting: the matched letters (`isMatch`) and the words they're in
 * (`isInMatchedWord`). Words are runs of letters, numbers and marks. The ranges are sorted and merged first, so any
 * ranges work.
 *
 * @param text - The text to split.
 * @param ranges - The ranges to mark, e.g. from {@link findMatchRanges}. For a query, use {@link getHighlightSegments}.
 * @returns The segments, which joined give back `text`. Empty for an empty text.
 * @example
 * ```ts
 * import { findMatchRanges, splitByMatchRanges } from '@kyco-utils/search'
 *
 * splitByMatchRanges('Invoice no', findMatchRanges('Invoice no', 'voi'))
 * // [
 * //   { text: 'In', isMatch: false, isInMatchedWord: true },
 * //   { text: 'voi', isMatch: true, isInMatchedWord: true },
 * //   { text: 'ce', isMatch: false, isInMatchedWord: true },
 * //   { text: ' no', isMatch: false, isInMatchedWord: false },
 * // ]
 * ```
 */
export const splitByMatchRanges = (text: string, ranges: readonly SearchMatchRange[]): HighlightSegment[] => {
  if (text === '') return []

  const matches = mergeRanges(ranges, text.length)
  const overlaps = (a: SearchMatchRange, b: SearchMatchRange) => a.start < b.end && b.start < a.end
  const matchedWords = Array.from(text.matchAll(WORDS), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  })).filter((word) => matches.some((match) => overlaps(word, match)))

  const boundaries = [
    ...new Set([0, text.length, ...[...matches, ...matchedWords].flatMap(({ start, end }) => [start, end])]),
  ].sort((a, b) => a - b)

  const segments: HighlightSegment[] = []
  for (let i = 0; i < boundaries.length - 1; i++) {
    const piece = { start: boundaries[i] ?? 0, end: boundaries[i + 1] ?? text.length }
    const isMatch = matches.some((match) => overlaps(piece, match))
    const isInMatchedWord = matchedWords.some((word) => overlaps(piece, word))
    const last = segments.at(-1)
    if (last !== undefined && last.isMatch === isMatch && last.isInMatchedWord === isInMatchedWord) {
      last.text += text.slice(piece.start, piece.end)
    } else {
      segments.push({ text: text.slice(piece.start, piece.end), isMatch, isInMatchedWord })
    }
  }
  return segments
}

/**
 * Splits a text into highlight segments for a query: shorthand for
 * `splitByMatchRanges(text, findMatchRanges(text, query, options))`.
 *
 * @param text - The text to split.
 * @param query - The search query.
 * @param options - See {@link SearchOptions}. Use the same options as for filtering.
 * @returns The segments, which joined give back `text`. Empty for an empty text.
 * @example
 * ```ts
 * import { getHighlightSegments } from '@kyco-utils/search'
 *
 * getHighlightSegments('Café Royal', 'caf')
 * // [
 * //   { text: 'Caf', isMatch: true, isInMatchedWord: true },
 * //   { text: 'é', isMatch: false, isInMatchedWord: true },
 * //   { text: ' Royal', isMatch: false, isInMatchedWord: false },
 * // ]
 * ```
 */
export const getHighlightSegments = (text: string, query: SearchQuery, options?: SearchOptions): HighlightSegment[] =>
  splitByMatchRanges(text, findMatchRanges(text, query, options))
