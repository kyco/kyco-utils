import * as mod from '@kyco-utils/search'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test: imports by package name → resolved through `exports` to the built `dist/`,
// like a real consumer. Logic is covered in `index.test.ts`.
describe('+ @kyco-utils/search (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(import.meta.resolve('@kyco-utils/search')).toMatch(/\/dist\/index\.mjs$/)
  })

  it('should expose only the public API', () => {
    expect(Object.keys(mod).sort()).toEqual([
      'filterBySearch',
      'findMatchRanges',
      'getHighlightSegments',
      'matchesSearch',
      'splitByMatchRanges',
    ])
  })

  it('should return true from matchesSearch when every word matches', () => {
    expect(
      mod.matchesSearch(['Mueller', null], 'müller', {
        ignoreDiacritics: true,
        germanNormalization: true,
        matchFrom: 'wordStart',
      }),
    ).toBe(true)
  })

  it('should return the matching items from filterBySearch', () => {
    const items = [{ name: 'José' }, { name: 'Anna' }]
    expect(
      mod.filterBySearch(items, ['jose'], (item) => [item.name], {
        ignoreDiacritics: true,
        germanNormalization: false,
        matchFrom: 'any',
      }),
    ).toEqual([{ name: 'José' }])
  })

  it('should return the matched ranges from findMatchRanges', () => {
    expect(
      mod.findMatchRanges('Herr Müller', 'mue', {
        ignoreDiacritics: false,
        germanNormalization: true,
        matchFrom: 'wordStart',
      }),
    ).toEqual([{ start: 5, end: 7 }])
  })

  it('should return segments from getHighlightSegments', () => {
    expect(
      mod.getHighlightSegments('Herr Müller', 'mue', {
        ignoreDiacritics: true,
        germanNormalization: true,
        matchFrom: 'wordStart',
      }),
    ).toEqual([
      { text: 'Herr ', isMatch: false, isInMatchedWord: false },
      { text: 'Mü', isMatch: true, isInMatchedWord: true },
      { text: 'ller', isMatch: false, isInMatchedWord: true },
    ])
  })

  it('should return segments from splitByMatchRanges', () => {
    expect(mod.splitByMatchRanges('Invoice', [{ start: 2, end: 5 }])).toEqual([
      { text: 'In', isMatch: false, isInMatchedWord: true },
      { text: 'voi', isMatch: true, isInMatchedWord: true },
      { text: 'ce', isMatch: false, isInMatchedWord: true },
    ])
  })
})
