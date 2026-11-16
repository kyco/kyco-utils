/** A text to search in. `null` and `undefined` never match. */
export type SearchText = string | null | undefined

/**
 * What to search for. Split into words on anything that isn't a letter or number; an array is joined with spaces
 * first, so `['john smith']` is two words.
 */
export type SearchQuery = string | readonly string[]

/**
 * How well a query matches a text, best first, as in [match-sorter](https://github.com/kentcdodds/match-sorter):
 *
 * - `equal`: the text equals the query (`paris` → Paris)
 * - `startsWith`: the text starts with it (`par` → Paris)
 * - `wordStartsWith`: a word in the text starts with it (`sm` → John Smith)
 * - `contains`: the text contains it (`voi` → Invoice)
 * - `acronym`: the initials of the text's words contain it (`ibm` → International Business Machines)
 * - `matches`: the text contains its letters in order (`muler` → Müller)
 */
export type SearchThreshold = 'equal' | 'startsWith' | 'wordStartsWith' | 'contains' | 'acronym' | 'matches'

/** Options shared by all search functions. Case is always ignored. */
export type SearchOptions = {
  /** The lowest tier that still counts as a match, see {@link SearchThreshold}. Default `'matches'`. */
  threshold?: SearchThreshold
  /** Ignore diacritics, so `e` matches `é` and `a` matches `ä`, and vice versa. Default `true`. */
  ignoreDiacritics?: boolean
  /** Also match `ae`, `oe`, `ue` with `ä`, `ö`, `ü` (German spelling), and vice versa. Default `true`. */
  germanNormalization?: boolean
  /** Sort the results of {@link filterBySearch} by relevance; `false` keeps the input order. Default `true`. */
  sort?: boolean
}

/**
 * A range in the original text, as string indexes (UTF-16), usable with `text.slice(start, end)`. `end` is
 * exclusive.
 */
export type SearchMatchRange = { start: number; end: number }

/** A piece of text from {@link getHighlightSegments} or {@link splitByMatchRanges}. */
export type HighlightSegment = {
  text: string
  /** `true` if this text was matched. */
  isMatch: boolean
  /**
   * `true` if this text is inside a word that has a match, e.g. to style the whole word. Can be `false` for a match,
   * e.g. the space matched by the whole query `john smith`.
   */
  isInMatchedWord: boolean
}

type FoldMode = { spellOut: boolean; stripMarks: boolean }
type Folded = { folded: string; starts: number[]; ends: number[] }
type Variant = { folded: string; initials: string }
type Needle = { raw: string; plain: string; spelled: string | null }
type Context = { plain: FoldMode; spelled: FoldMode | null; min: number }
type Rank = { score: number; textIndex: number }

const TIERS: Record<SearchThreshold, number> = {
  equal: 6,
  startsWith: 5,
  wordStartsWith: 4,
  contains: 3,
  acronym: 2,
  matches: 1,
}
const CASE_SENSITIVE_BONUS = 0.5
const NO_MATCH: Rank = { score: 0, textIndex: 0 }

const NON_WORD_CHARS = /[^\p{L}\p{N}\p{M}]+/u
const WORD_CHAR_AT_END = /[\p{L}\p{N}\p{M}]$/u
const WORDS = /[\p{L}\p{N}\p{M}]+/gu
/** Punctuation between two letters or numbers, as in `Rock'n'Roll`, `e-mail` or `O'Neil`. Spaces are kept. */
const JOINERS = /(?<=[\p{L}\p{N}\p{M}])[^\p{L}\p{N}\p{M}\s]+(?=[\p{L}\p{N}\p{M}])/gu
const UNITS = /\P{M}\p{M}*|\p{M}+/gu
const MARKS = /\p{M}/gu
const UMLAUTS = /[äöü]/g
const SPELL_OUT_TRIGGER = /[äöü]|ae|oe|ue/
const SPELLED_OUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue' }

const MAX_TEXT_CACHE_SIZE = 100_000
const MAX_UNIT_CACHE_SIZE = 10_000

const modeIndex = ({ spellOut, stripMarks }: FoldMode): number => (spellOut ? 2 : 0) + (stripMarks ? 1 : 0)
const textCaches: Map<string, Variant[]>[] = [new Map(), new Map(), new Map(), new Map()]
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

const foldString = (text: string, mode: FoldMode): string =>
  isAscii(text) ? text.toLowerCase() : fold(text, mode).folded

/** Drops punctuation inside words, keeping the offsets of what's left; `null` if there's none. */
const compact = ({ folded, starts, ends }: Folded): Folded | null => {
  let result: Folded | null = null
  let last = 0
  for (const match of folded.matchAll(JOINERS)) {
    result ??= { folded: '', starts: [], ends: [] }
    result.folded += folded.slice(last, match.index)
    result.starts.push(...starts.slice(last, match.index))
    result.ends.push(...ends.slice(last, match.index))
    last = match.index + match[0].length
  }
  if (result === null) return null
  result.folded += folded.slice(last)
  result.starts.push(...starts.slice(last))
  result.ends.push(...ends.slice(last))
  return result
}

/** Folded indexes where a word starts. */
const getWordStarts = (folded: string): number[] => Array.from(folded.matchAll(WORDS), (match) => match.index)

const getInitials = (folded: string): string =>
  getWordStarts(folded)
    .map((index) => folded[index])
    .join('')

/** The folded text and, if it has punctuation inside words, the folded text without it. Cached per text and mode. */
const getVariants = (text: string, mode: FoldMode): Variant[] => {
  const cache = textCaches[isAscii(text) ? 0 : modeIndex(mode)] as Map<string, Variant[]>
  const cached = cache.get(text)
  if (cached !== undefined) return cached

  const folded = foldString(text, mode)
  const compacted = folded.replace(JOINERS, '')
  const variants = [{ folded, initials: getInitials(folded) }]
  if (compacted !== folded) variants.push({ folded: compacted, initials: getInitials(compacted) })

  if (cache.size >= MAX_TEXT_CACHE_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(text, variants)
  return variants
}

const getContext = (options: SearchOptions | undefined): Context => {
  const stripMarks = options?.ignoreDiacritics ?? true
  return {
    plain: { spellOut: false, stripMarks },
    spelled: (options?.germanNormalization ?? true) ? { spellOut: true, stripMarks } : null,
    min: TIERS[options?.threshold ?? 'matches'],
  }
}

const toNeedle = (raw: string, { plain, spelled }: Context): Needle => ({
  raw: raw.normalize('NFC'),
  plain: foldString(raw, plain),
  // Spelling out can only add a meaningful match for words with an umlaut or its spelled-out form.
  spelled:
    spelled !== null && SPELL_OUT_TRIGGER.test(foldString(raw, { spellOut: false, stripMarks: false }))
      ? foldString(raw, spelled)
      : null,
})

/** The query words and, for more than one word, the whole query (words joined by a space). */
const getNeedles = (query: SearchQuery, context: Context): { words: Needle[]; whole: Needle | null } => {
  const joined = typeof query === 'string' ? query : query.join(' ')
  const raws = joined.split(NON_WORD_CHARS).filter((word) => word !== '')
  return {
    words: raws.map((raw) => toNeedle(raw, context)),
    whole: raws.length > 1 ? toNeedle(raws.join(' '), context) : null,
  }
}

const isWordStartAt = (folded: string, index: number): boolean =>
  index === 0 || !WORD_CHAR_AT_END.test(folded.slice(Math.max(0, index - 2), index))

/** The tier of an occurrence of `needle` at `index`. */
const tierAt = (folded: string, needle: string, index: number): number => {
  if (index === 0) return needle.length === folded.length ? TIERS.equal : TIERS.startsWith
  return isWordStartAt(folded, index) ? TIERS.wordStartsWith : TIERS.contains
}

/** Folded indexes of `needle`'s letters in order, from the first occurrence of its first letter (like match-sorter). */
const findLettersInOrder = (folded: string, needle: string): number[] | null => {
  const indexes: number[] = []
  let index = -1
  for (const char of needle) {
    index = folded.indexOf(char, index + 1)
    if (index === -1) return null
    indexes.push(index)
    index += char.length - 1
  }
  return indexes
}

/** The score of `needle` in a folded text: its tier, plus a fraction for closeness within `matches`. 0 for no match. */
const scoreVariant = ({ folded, initials }: Variant, needle: string, min: number): number => {
  const index = folded.indexOf(needle)
  if (index !== -1) {
    let best = tierAt(folded, needle, index)
    // A later occurrence may be at a word start.
    if (best === TIERS.contains) {
      for (let next = folded.indexOf(needle, index + 1); next !== -1; next = folded.indexOf(needle, next + 1)) {
        if (isWordStartAt(folded, next)) {
          best = TIERS.wordStartsWith
          break
        }
      }
    }
    return best
  }
  if (min <= TIERS.acronym && initials.includes(needle)) return TIERS.acronym
  if (min <= TIERS.matches) {
    const indexes = findLettersInOrder(folded, needle)
    if (indexes !== null) {
      const spread = (indexes.at(-1) ?? 0) - (indexes[0] ?? 0) + 1
      return TIERS.matches + (needle.length / spread) * 0.99
    }
  }
  return 0
}

const scoreText = (text: string, needle: Needle, context: Context): number => {
  let best = 0
  for (const variant of getVariants(text, context.plain))
    best = Math.max(best, scoreVariant(variant, needle.plain, context.min))
  if (context.spelled !== null && needle.spelled !== null) {
    for (const variant of getVariants(text, context.spelled)) {
      best = Math.max(best, scoreVariant(variant, needle.spelled, context.min))
    }
  }
  if (best === TIERS.equal && text.normalize('NFC') === needle.raw) best += CASE_SENSITIVE_BONUS
  return best < context.min ? 0 : best
}

/** The best score of `needle` over `texts`, and the index of the first text with it. */
const rankTexts = (texts: readonly SearchText[], needle: Needle, context: Context): Rank => {
  let best = NO_MATCH
  texts.forEach((text, textIndex) => {
    if (text === null || text === undefined || text === '') return
    const score = scoreText(text, needle, context)
    if (score > best.score) best = { score, textIndex }
  })
  return best
}

/**
 * Ranks an item: the whole query's rank, or, if every word matches, the weakest word's rank, whichever is better.
 * `score` is 0 if the item doesn't match.
 */
const rankItem = (
  texts: readonly SearchText[],
  { words, whole }: { words: readonly Needle[]; whole: Needle | null },
  context: Context,
): Rank => {
  let weakest: Rank | null = null
  for (const word of words) {
    const rank = rankTexts(texts, word, context)
    if (rank.score === 0) {
      weakest = NO_MATCH
      break
    }
    if (weakest === null || rank.score < weakest.score) weakest = rank
  }
  const wholeRank = whole === null ? NO_MATCH : rankTexts(texts, whole, context)
  if (weakest === null) return wholeRank
  return wholeRank.score > weakest.score ? wholeRank : weakest
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

/**
 * Returns whether the query matches the texts at or above the `threshold` tier: every query word in at least one of
 * the texts, in any order, or the whole query in one text. A query without words matches everything.
 *
 * @param texts - The texts to search in, e.g. several fields of one item.
 * @param query - The search query.
 * @param options - See {@link SearchOptions}.
 * @returns `true` if the query matches.
 * @example
 * ```ts
 * import { matchesSearch } from '@kyco-utils/search'
 *
 * matchesSearch(['Renée Smith', 'Paris'], 'smith renee') // true
 * matchesSearch(["Rock'n'Roll"], 'rocknroll') // true
 * matchesSearch(['Invoice'], 'voice', { threshold: 'wordStartsWith' }) // false
 * ```
 */
export const matchesSearch = (texts: readonly SearchText[], query: SearchQuery, options?: SearchOptions): boolean => {
  const context = getContext(options)
  const needles = getNeedles(query, context)
  return needles.words.length === 0 || rankItem(texts, needles, context).score > 0
}

/**
 * Returns the items the query matches (see {@link matchesSearch}), best first: by tier (exact case first for `equal`,
 * closer letters first for `matches`), then by the order of the texts from `getTexts` (earlier texts weigh more), then
 * in input order. With `sort: false`, in input order. For a query without words, returns `items` itself, not a copy.
 * Folded texts are cached, so searching the same list again is cheap.
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
  const context = getContext(options)
  const needles = getNeedles(query, context)
  if (needles.words.length === 0) return items

  const ranked: { item: T; rank: Rank }[] = []
  for (const item of items) {
    const rank = rankItem(getTexts(item), needles, context)
    if (rank.score > 0) ranked.push({ item, rank })
  }
  if (options?.sort ?? true) {
    // Stable, so ties keep the input order.
    ranked.sort((a, b) => b.rank.score - a.rank.score || a.rank.textIndex - b.rank.textIndex)
  }
  return ranked.map(({ item }) => item)
}

/**
 * Returns the ranges of the original text matched by the query, sorted and merged, for highlighting. Per query word,
 * the ranges of its best tier in this text, at or above `threshold`: every occurrence for `contains` and better, the
 * initials for `acronym`, the letters for `matches`. Ranges always cover whole characters, e.g. the whole `ß` when only
 * one `s` matched.
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
 * findMatchRanges('Müller', 'mlr') // [{ start: 0, end: 1 }, { start: 2, end: 3 }, { start: 5, end: 6 }]
 * ```
 */
export const findMatchRanges = (text: string, query: SearchQuery, options?: SearchOptions): SearchMatchRange[] => {
  const context = getContext(options)
  const { words, whole } = getNeedles(query, context)
  if (words.length === 0 || text === '') return []

  const foldedByMode = new Map<FoldMode, Folded[]>()
  const getFolded = (mode: FoldMode): Folded[] => {
    let variants = foldedByMode.get(mode)
    if (variants === undefined) {
      const folded = fold(text, mode)
      const compacted = compact(folded)
      variants = compacted === null ? [folded] : [folded, compacted]
      foldedByMode.set(mode, variants)
    }
    return variants
  }
  const ranges: SearchMatchRange[] = []
  const rangeOf = ({ starts, ends }: Folded, first: number, last: number): SearchMatchRange => ({
    start: starts[first] ?? 0,
    end: ends[last] ?? text.length,
  })

  /** Adds the ranges of the needle's best tier in this text; with `substringsOnly`, only for `contains` and better. */
  const collect = (needle: Needle, substringsOnly: boolean) => {
    const pairs: [Folded, string][] = getFolded(context.plain).map((folded) => [folded, needle.plain])
    if (context.spelled !== null && needle.spelled !== null) {
      for (const folded of getFolded(context.spelled)) pairs.push([folded, needle.spelled])
    }

    let found = false
    for (const [folded, value] of pairs) {
      for (let index = folded.folded.indexOf(value); index !== -1; index = folded.folded.indexOf(value, index + 1)) {
        if (tierAt(folded.folded, value, index) < context.min) continue
        ranges.push(rangeOf(folded, index, index + value.length - 1))
        found = true
      }
    }
    if (found || substringsOnly) return

    if (context.min <= TIERS.acronym) {
      for (const [folded, value] of pairs) {
        const wordStarts = getWordStarts(folded.folded)
        const index = wordStarts
          .map((start) => folded.folded[start])
          .join('')
          .indexOf(value)
        if (index === -1) continue
        for (const start of wordStarts.slice(index, index + value.length)) ranges.push(rangeOf(folded, start, start))
        return
      }
    }

    if (context.min <= TIERS.matches) {
      for (const [folded, value] of pairs) {
        const indexes = findLettersInOrder(folded.folded, value)
        if (indexes === null) continue
        for (const index of indexes) ranges.push(rangeOf(folded, index, index))
        return
      }
    }
  }

  for (const word of words) collect(word, false)
  if (whole !== null) collect(whole, true)

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
