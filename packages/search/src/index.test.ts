import { describe, expect, it } from 'vite-plus/test'

import type { SearchOptions, SearchText } from './index'

import { filterBySearch, findMatchRanges, getHighlightSegments, matchesSearch, splitByMatchRanges } from './index'

const NAMES = ['Müller', 'Mueller', 'Muller'] as const

/** The texts from `texts` that `query` finds, each searched on its own. */
const found = (texts: readonly string[], query: string, options?: SearchOptions) =>
  texts.filter((text) => matchesSearch([text], query, options))

/** The matched substrings, for readable range assertions. */
const matched = (text: string, query: string, options?: SearchOptions) =>
  findMatchRanges(text, query, options).map(({ start, end }) => text.slice(start, end))

describe('+ @kyco-utils/search', () => {
  describe('- matchesSearch', () => {
    describe('case and diacritics', () => {
      it('should ignore case', () => {
        expect(matchesSearch(['Hello World'], 'WORLD')).toBe(true)
        expect(matchesSearch(['HELLO'], 'hello')).toBe(true)
      })

      it('should ignore diacritics by default', () => {
        expect(matchesSearch(['José'], 'jose')).toBe(true)
        expect(matchesSearch(['Jose'], 'josé')).toBe(true)
        expect(matchesSearch(['Zoë'], 'zoe')).toBe(true)
        expect(matchesSearch(['Bär'], 'bar')).toBe(true)
      })

      it('should match diacritics exactly when ignoreDiacritics is false', () => {
        expect(matchesSearch(['José'], 'jose', { ignoreDiacritics: false })).toBe(false)
        expect(matchesSearch(['Jose'], 'josé', { ignoreDiacritics: false })).toBe(false)
        expect(matchesSearch(['José'], 'JOSÉ', { ignoreDiacritics: false })).toBe(true)
      })

      it('should treat ß and ss as equal in every mode', () => {
        for (const options of [{}, { ignoreDiacritics: false }, { germanNormalization: true }]) {
          expect(matchesSearch(['Straße'], 'strasse', options)).toBe(true)
          expect(matchesSearch(['Strasse'], 'straße', options)).toBe(true)
          expect(matchesSearch(['STRAẞE'], 'strasse', options)).toBe(true)
        }
      })

      it('should match NFC and NFD input alike', () => {
        const nfc = 'José Müller'.normalize('NFC')
        const nfd = 'José Müller'.normalize('NFD')
        for (const options of [
          {},
          { ignoreDiacritics: false },
          { germanNormalization: true, ignoreDiacritics: false },
        ]) {
          expect(matchesSearch([nfd], nfc, options)).toBe(true)
          expect(matchesSearch([nfc], nfd, options)).toBe(true)
        }
      })

      it('should spell out umlauts typed with a combining diaeresis', () => {
        expect(matchesSearch(['Müller'], 'mueller', { germanNormalization: true })).toBe(true)
        expect(matchesSearch(['Mueller'], 'müller', { germanNormalization: true })).toBe(true)
      })
    })

    describe('option combinations for "müller"', () => {
      it('should find Müller and Muller with the defaults', () => {
        expect(found(NAMES, 'müller')).toEqual(['Müller', 'Muller'])
      })

      it('should find Müller, Mueller and Muller with ignoreDiacritics and germanNormalization', () => {
        expect(found(NAMES, 'müller', { germanNormalization: true })).toEqual(['Müller', 'Mueller', 'Muller'])
      })

      it('should find only Müller without ignoreDiacritics or germanNormalization', () => {
        expect(found(NAMES, 'müller', { ignoreDiacritics: false })).toEqual(['Müller'])
      })

      it('should find Müller and Mueller but not Muller with only germanNormalization', () => {
        expect(found(NAMES, 'müller', { ignoreDiacritics: false, germanNormalization: true })).toEqual([
          'Müller',
          'Mueller',
        ])
      })
    })

    describe('germanNormalization', () => {
      it('should find Müller and Mueller for "mueller" and "müller"', () => {
        for (const ignoreDiacritics of [true, false]) {
          const options = { germanNormalization: true, ignoreDiacritics }
          expect(found(['Müller', 'Mueller'], 'mueller', options)).toEqual(['Müller', 'Mueller'])
          expect(found(['Müller', 'Mueller'], 'müller', options)).toEqual(['Müller', 'Mueller'])
        }
      })

      it('should not find Muller for "mueller"', () => {
        expect(matchesSearch(['Muller'], 'mueller', { germanNormalization: true })).toBe(false)
      })

      it('should handle uppercase umlauts', () => {
        expect(matchesSearch(['ÄRGER'], 'aerger', { germanNormalization: true })).toBe(true)
        expect(matchesSearch(['Aerger'], 'Ärger', { germanNormalization: true })).toBe(true)
      })

      it('should not let "er" find Bär', () => {
        expect(matchesSearch(['Bär'], 'er', { germanNormalization: true })).toBe(false)
      })

      it('should not let "e" find Währung', () => {
        expect(matchesSearch(['Währung'], 'e', { germanNormalization: true })).toBe(false)
      })

      it('should not spell out umlauts by default', () => {
        expect(matchesSearch(['Müller'], 'mueller')).toBe(false)
      })
    })

    describe('query splitting', () => {
      it('should split on commas and spaces', () => {
        expect(matchesSearch(['Smith John'], 'Smith, John')).toBe(true)
      })

      it('should split on hyphens, so "e-mail" finds "email"', () => {
        expect(matchesSearch(['email'], 'e-mail')).toBe(true)
        expect(matchesSearch(['e-mail'], 'e-mail')).toBe(true)
      })

      it('should split e-mail addresses into words', () => {
        expect(matchesSearch(['anna@example.com'], 'anna@example.com')).toBe(true)
        expect(matchesSearch(['anna example com'], 'anna@example.com')).toBe(true)
        expect(matchesSearch(['anna@example.org'], 'anna@example.com')).toBe(false)
      })

      it('should drop symbols, so "c#" becomes "c"', () => {
        expect(matchesSearch(['C (language)'], 'c#')).toBe(true)
      })

      it('should match everything for a query of only punctuation', () => {
        expect(matchesSearch(['anything'], '!?., -')).toBe(true)
        expect(matchesSearch([], '#')).toBe(true)
      })

      it('should treat array queries as separate words', () => {
        expect(matchesSearch(['John Smith'], ['smith', 'john'])).toBe(true)
        expect(matchesSearch(['John Smith'], ['smith', 'jane'])).toBe(false)
        expect(matchesSearch(['John Smith'], ['smith,john'])).toBe(true)
        expect(matchesSearch(['John Smith'], [])).toBe(true)
      })

      it('should keep numbers and letters from other scripts', () => {
        expect(matchesSearch(['Order 4711'], '4711')).toBe(true)
        expect(matchesSearch(['Москва'], 'моск')).toBe(true)
        expect(matchesSearch(['東京都'], '京')).toBe(true)
      })
    })

    describe('matchFrom', () => {
      it('should match anywhere in a word with "any"', () => {
        expect(matchesSearch(['Invoice'], 'voice')).toBe(true)
        expect(matchesSearch(['Invoice'], 'voice', { matchFrom: 'any' })).toBe(true)
      })

      it('should match only at word starts with "wordStart"', () => {
        const options = { matchFrom: 'wordStart' } as const
        expect(matchesSearch(['Invoice'], 'voice', options)).toBe(false)
        expect(matchesSearch(['Invoice'], 'inv', options)).toBe(true)
      })

      it('should treat the start of the text, spaces and punctuation as word starts', () => {
        const options = { matchFrom: 'wordStart' } as const
        expect(matchesSearch(['Invoice number'], 'num', options)).toBe(true)
        expect(matchesSearch(['(language)'], 'lang', options)).toBe(true)
        expect(matchesSearch(['anna@example.com'], 'example', options)).toBe(true)
        expect(matchesSearch(['e-mail'], 'mail', options)).toBe(true)
        expect(matchesSearch(['email'], 'mail', options)).toBe(false)
      })

      it('should find a later occurrence at a word start', () => {
        expect(matchesSearch(['banana nan'], 'nan', { matchFrom: 'wordStart' })).toBe(true)
      })

      it('should not treat a position after a letter with diacritics as a word start', () => {
        expect(matchesSearch(['Zoëlle'], 'lle', { matchFrom: 'wordStart' })).toBe(false)
        expect(matchesSearch(['Zoëlle'], 'lle', { matchFrom: 'wordStart', ignoreDiacritics: false })).toBe(false)
      })

      it('should not match the second letter of a spelled-out umlaut as a word start', () => {
        expect(matchesSearch(['Ärger'], 'erger', { matchFrom: 'wordStart', germanNormalization: true })).toBe(false)
        expect(matchesSearch(['Ärger'], 'aerger', { matchFrom: 'wordStart', germanNormalization: true })).toBe(true)
      })
    })

    describe('several words and texts', () => {
      it('should require every word, in any order', () => {
        expect(matchesSearch(['John Smith'], 'smith john')).toBe(true)
        expect(matchesSearch(['John Smith'], 'smith jane')).toBe(false)
      })

      it('should match words spread across texts', () => {
        expect(matchesSearch(['John', 'Smith', 'Berlin'], 'berlin john')).toBe(true)
        expect(matchesSearch(['John', 'Smith'], 'berlin john')).toBe(false)
      })

      it('should let several query words match the same text part', () => {
        expect(matchesSearch(['Anna'], 'an anna')).toBe(true)
      })
    })

    describe('empty input', () => {
      it('should skip null, undefined and empty texts', () => {
        const texts: SearchText[] = [null, undefined, '', 'Bern']
        expect(matchesSearch(texts, 'bern')).toBe(true)
        expect(matchesSearch([null, undefined, ''], 'bern')).toBe(false)
      })

      it('should match everything for queries without words', () => {
        for (const query of ['', '   ', [], ['', ' ']]) {
          expect(matchesSearch(['anything'], query)).toBe(true)
          expect(matchesSearch([null], query)).toBe(true)
        }
      })
    })

    it('should match regex characters literally', () => {
      expect(matchesSearch(['a.b'], '.*')).toBe(true)
      expect(matchesSearch(['abc'], 'a.d')).toBe(false)
      expect(matchesSearch(['a(b)c'], 'b)')).toBe(true)
      expect(matchesSearch(['price $5'], '$5')).toBe(true)
      expect(matchesSearch(['x'], '[x]')).toBe(true)
      expect(matchesSearch(['y'], '[x]')).toBe(false)
    })
  })

  describe('- filterBySearch', () => {
    const items = [
      { name: 'Anna Müller', city: 'Zürich', id: 12 },
      { name: 'John Smith', city: 'Bern', id: 345 },
      { name: 'Jane Mueller', city: null, id: 678 },
    ]
    const getTexts = (item: (typeof items)[number]) => [item.name, item.city, String(item.id)]

    it('should return the matching items in their original order', () => {
      expect(filterBySearch(items, 'zurich', getTexts)).toEqual([items[0]])
      expect(filterBySearch(items, 'j', getTexts)).toEqual([items[1], items[2]])
    })

    it('should match numbers converted with String()', () => {
      expect(filterBySearch(items, '34', getTexts)).toEqual([items[1]])
    })

    it('should pass the options on', () => {
      expect(filterBySearch(items, 'müller', getTexts, { germanNormalization: true })).toEqual([items[0], items[2]])
      expect(filterBySearch(items, 'mu', getTexts, { ignoreDiacritics: false })).toEqual([items[2]])
      expect(filterBySearch(items, 'ith', getTexts, { matchFrom: 'wordStart' })).toEqual([])
    })

    it('should return items itself for queries without words', () => {
      for (const query of ['', '  ', '-', []]) {
        expect(filterBySearch(items, query, getTexts)).toBe(items)
      }
    })

    it('should return a new empty array when nothing matches', () => {
      expect(filterBySearch(items, 'nothing', getTexts)).toEqual([])
    })
  })

  describe('- findMatchRanges', () => {
    it('should return the exact matched letters', () => {
      expect(findMatchRanges('Hello World', 'wor')).toEqual([{ start: 6, end: 9 }])
    })

    it('should return every occurrence, sorted', () => {
      expect(findMatchRanges('Anna and Ann', 'an')).toEqual([
        { start: 0, end: 2 },
        { start: 5, end: 7 },
        { start: 9, end: 11 },
      ])
    })

    it('should return ranges for each query word', () => {
      expect(matched('John Smith', 'smith jo')).toEqual(['Jo', 'Smith'])
    })

    it('should merge overlapping and adjacent ranges', () => {
      expect(findMatchRanges('banana', 'ana')).toEqual([{ start: 1, end: 6 }])
      expect(findMatchRanges('abcd', 'ab cd')).toEqual([{ start: 0, end: 4 }])
      expect(findMatchRanges('abcd', 'abc bc')).toEqual([{ start: 0, end: 3 }])
    })

    it('should map ranges back through diacritics', () => {
      expect(matched('José Müller', 'muller jose')).toEqual(['José', 'Müller'])
    })

    it('should map ranges back through NFD input', () => {
      const text = 'José X'
      expect(findMatchRanges(text, 'jose')).toEqual([{ start: 0, end: 5 }])
      expect(findMatchRanges(text, 'jos')).toEqual([{ start: 0, end: 3 }])
    })

    it('should map ranges back through ß', () => {
      expect(findMatchRanges('Straße', 'strasse')).toEqual([{ start: 0, end: 6 }])
      expect(findMatchRanges('Straße 1', 'ss')).toEqual([{ start: 4, end: 5 }])
      expect(findMatchRanges('Straße', 'ße')).toEqual([{ start: 4, end: 6 }])
      expect(findMatchRanges('Fuß', 'fus')).toEqual([{ start: 0, end: 3 }])
    })

    it('should map ranges back through spelled-out umlauts', () => {
      const options = { germanNormalization: true }
      expect(findMatchRanges('Müller', 'mueller', options)).toEqual([{ start: 0, end: 6 }])
      expect(findMatchRanges('Herr Müller', 'mue', options)).toEqual([{ start: 5, end: 7 }])
      expect(findMatchRanges('Müller', 'mue', options)).toEqual([{ start: 0, end: 3 }])
      expect(findMatchRanges('Mueller', 'müller', options)).toEqual([{ start: 0, end: 7 }])
    })

    it('should combine ranges from the plain and spelled-out comparisons', () => {
      expect(matched('Muller Mueller Müller', 'müller', { germanNormalization: true })).toEqual([
        'Muller',
        'Mueller',
        'Müller',
      ])
    })

    it('should not return ranges that only the spelled-out comparison would find for other words', () => {
      expect(findMatchRanges('Bär', 'er', { germanNormalization: true })).toEqual([])
    })

    it('should respect ignoreDiacritics', () => {
      expect(matched('José Jose', 'jose', { ignoreDiacritics: false })).toEqual(['Jose'])
    })

    it('should only return ranges at word starts with "wordStart"', () => {
      expect(matched('Invoice voice', 'voice', { matchFrom: 'wordStart' })).toEqual(['voice'])
      expect(findMatchRanges('Invoice voice', 'voice', { matchFrom: 'wordStart' })).toEqual([{ start: 8, end: 13 }])
    })

    it('should map ranges correctly after characters outside the BMP', () => {
      expect(findMatchRanges('😀 Zoë', 'zoe')).toEqual([{ start: 3, end: 6 }])
    })

    it('should match regex characters literally', () => {
      expect(findMatchRanges('a.b axb', 'a.b')).toEqual([
        { start: 0, end: 1 },
        { start: 2, end: 3 },
        { start: 4, end: 5 },
        { start: 6, end: 7 },
      ])
    })

    it('should return no ranges for queries without words or empty texts', () => {
      expect(findMatchRanges('Hello', '')).toEqual([])
      expect(findMatchRanges('Hello', ' , ')).toEqual([])
      expect(findMatchRanges('Hello', [])).toEqual([])
      expect(findMatchRanges('', 'hello')).toEqual([])
    })

    it('should return no ranges when nothing matches', () => {
      expect(findMatchRanges('Hello', 'xyz')).toEqual([])
    })
  })

  describe('- splitByMatchRanges', () => {
    it('should return one unmatched segment without ranges', () => {
      expect(splitByMatchRanges('Hello World', [])).toEqual([
        { text: 'Hello World', isMatch: false, isInMatchedWord: false },
      ])
    })

    it('should return no segments for an empty text', () => {
      expect(splitByMatchRanges('', [{ start: 0, end: 1 }])).toEqual([])
    })

    it('should handle a range at the start', () => {
      expect(splitByMatchRanges('Hello World', [{ start: 0, end: 2 }])).toEqual([
        { text: 'He', isMatch: true, isInMatchedWord: true },
        { text: 'llo', isMatch: false, isInMatchedWord: true },
        { text: ' World', isMatch: false, isInMatchedWord: false },
      ])
    })

    it('should handle a range at the end', () => {
      expect(splitByMatchRanges('Hello World', [{ start: 9, end: 11 }])).toEqual([
        { text: 'Hello ', isMatch: false, isInMatchedWord: false },
        { text: 'Wor', isMatch: false, isInMatchedWord: true },
        { text: 'ld', isMatch: true, isInMatchedWord: true },
      ])
    })

    it('should mark a whole matched word', () => {
      expect(splitByMatchRanges('Hello World', [{ start: 6, end: 11 }])).toEqual([
        { text: 'Hello ', isMatch: false, isInMatchedWord: false },
        { text: 'World', isMatch: true, isInMatchedWord: true },
      ])
    })

    it('should mark the word around a partial match', () => {
      expect(splitByMatchRanges('an Invoice no', [{ start: 5, end: 8 }])).toEqual([
        { text: 'an ', isMatch: false, isInMatchedWord: false },
        { text: 'In', isMatch: false, isInMatchedWord: true },
        { text: 'voi', isMatch: true, isInMatchedWord: true },
        { text: 'ce', isMatch: false, isInMatchedWord: true },
        { text: ' no', isMatch: false, isInMatchedWord: false },
      ])
    })

    it('should merge adjacent ranges', () => {
      expect(
        splitByMatchRanges('abcdef', [
          { start: 0, end: 2 },
          { start: 2, end: 4 },
        ]),
      ).toEqual([
        { text: 'abcd', isMatch: true, isInMatchedWord: true },
        { text: 'ef', isMatch: false, isInMatchedWord: true },
      ])
    })

    it('should merge overlapping and unsorted ranges', () => {
      expect(
        splitByMatchRanges('abcdef xyz', [
          { start: 3, end: 5 },
          { start: 1, end: 4 },
          { start: 8, end: 9 },
        ]),
      ).toEqual([
        { text: 'a', isMatch: false, isInMatchedWord: true },
        { text: 'bcde', isMatch: true, isInMatchedWord: true },
        { text: 'f', isMatch: false, isInMatchedWord: true },
        { text: ' ', isMatch: false, isInMatchedWord: false },
        { text: 'x', isMatch: false, isInMatchedWord: true },
        { text: 'y', isMatch: true, isInMatchedWord: true },
        { text: 'z', isMatch: false, isInMatchedWord: true },
      ])
    })

    it('should handle several matches in one word', () => {
      expect(
        splitByMatchRanges('banana', [
          { start: 0, end: 1 },
          { start: 4, end: 5 },
        ]),
      ).toEqual([
        { text: 'b', isMatch: true, isInMatchedWord: true },
        { text: 'ana', isMatch: false, isInMatchedWord: true },
        { text: 'n', isMatch: true, isInMatchedWord: true },
        { text: 'a', isMatch: false, isInMatchedWord: true },
      ])
    })

    it('should treat punctuation as a word boundary', () => {
      expect(splitByMatchRanges('e-mail', [{ start: 2, end: 4 }])).toEqual([
        { text: 'e-', isMatch: false, isInMatchedWord: false },
        { text: 'ma', isMatch: true, isInMatchedWord: true },
        { text: 'il', isMatch: false, isInMatchedWord: true },
      ])
    })

    it('should mark matched characters outside words without marking a word', () => {
      expect(splitByMatchRanges('a - b', [{ start: 2, end: 3 }])).toEqual([
        { text: 'a ', isMatch: false, isInMatchedWord: false },
        { text: '-', isMatch: true, isInMatchedWord: false },
        { text: ' b', isMatch: false, isInMatchedWord: false },
      ])
    })

    it('should keep combining marks in the word', () => {
      const text = 'José X'
      expect(splitByMatchRanges(text, [{ start: 0, end: 1 }])).toEqual([
        { text: 'J', isMatch: true, isInMatchedWord: true },
        { text: 'osé', isMatch: false, isInMatchedWord: true },
        { text: ' X', isMatch: false, isInMatchedWord: false },
      ])
    })

    it('should clamp and ignore invalid ranges', () => {
      expect(
        splitByMatchRanges('abc', [
          { start: -5, end: 1 },
          { start: 2, end: 99 },
          { start: 2, end: 2 },
          { start: 3, end: 1 },
        ]),
      ).toEqual([
        { text: 'a', isMatch: true, isInMatchedWord: true },
        { text: 'b', isMatch: false, isInMatchedWord: true },
        { text: 'c', isMatch: true, isInMatchedWord: true },
      ])
    })

    it('should give back the text when joined', () => {
      const text = 'Anna Müller, Straße 5'
      const segments = splitByMatchRanges(text, findMatchRanges(text, 'mul stras'))
      expect(segments.map((segment) => segment.text).join('')).toBe(text)
    })
  })

  describe('- getHighlightSegments', () => {
    it('should split the text by the ranges findMatchRanges finds', () => {
      const text = 'Anna Müller, Straße 5'
      for (const query of ['mul stras', 'an 5', 'xyz', '']) {
        expect(getHighlightSegments(text, query)).toEqual(splitByMatchRanges(text, findMatchRanges(text, query)))
      }
    })

    it('should pass the options on', () => {
      expect(getHighlightSegments('Herr Müller', 'mue', { germanNormalization: true })).toEqual([
        { text: 'Herr ', isMatch: false, isInMatchedWord: false },
        { text: 'Mü', isMatch: true, isInMatchedWord: true },
        { text: 'ller', isMatch: false, isInMatchedWord: true },
      ])
      expect(getHighlightSegments('Invoice voice', 'voice', { matchFrom: 'wordStart' })).toEqual([
        { text: 'Invoice ', isMatch: false, isInMatchedWord: false },
        { text: 'voice', isMatch: true, isInMatchedWord: true },
      ])
    })

    it('should return one unmatched segment for a query without words', () => {
      expect(getHighlightSegments('Hello', ' ')).toEqual([{ text: 'Hello', isMatch: false, isInMatchedWord: false }])
    })

    it('should return no segments for an empty text', () => {
      expect(getHighlightSegments('', 'hello')).toEqual([])
    })
  })

  describe('- performance', () => {
    it('should filter 10k items with 3 fields well within a frame per keystroke', () => {
      const first = ['Anna', 'José', 'Jürgen', 'Zoë', 'Michael', 'Sören', 'Björk', 'Łukasz']
      const last = ['Müller', 'Smith', 'Straße', 'Østergaard', 'Dvořák', 'Nguyễn', 'Brown', 'Weiß']
      const cities = ['Zürich', 'Köln', 'São Paulo', 'Kraków', 'London', 'Málaga', 'Genève', 'Århus']
      const items = Array.from({ length: 10_000 }, (_, i) => ({
        name: `${first[i % first.length]} ${last[(i * 7) % last.length]} ${i}`,
        city: cities[(i * 3) % cities.length],
        id: String(i * 13),
      }))
      const getTexts = (item: (typeof items)[number]) => [item.name, item.city, item.id]
      const options = { germanNormalization: true }
      const keystrokes = ['m', 'mu', 'mue', 'muel', 'muell', 'mueller', 'mueller z', 'mueller zu']

      // First pass folds every text once, like the first keystroke.
      for (const query of keystrokes) filterBySearch(items, query, getTexts, options)

      const durations = keystrokes.map((query) => {
        const start = performance.now()
        filterBySearch(items, query, getTexts, options)
        return performance.now() - start
      })
      const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] ?? Number.POSITIVE_INFINITY

      expect(filterBySearch(items, 'mueller zurich', getTexts, options).length).toBeGreaterThan(0)
      expect(median).toBeLessThan(16)
    })
  })
})
