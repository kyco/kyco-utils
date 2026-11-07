import { createRequire } from 'node:module'

import * as esm from '@kyco-utils/number'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test: imports by package name → resolved through `exports` to the built `dist/`,
// like a real consumer. Logic is covered in `index.test.ts`.
const require = createRequire(import.meta.url)
const cjs = require('@kyco-utils/number') as typeof esm

describe('+ @kyco-utils/number (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(require.resolve('@kyco-utils/number')).toMatch(/[\\/]dist[\\/]index\.cjs$/)
    expect(import.meta.resolve('@kyco-utils/number')).toMatch(/\/dist\/index\.mjs$/)
  })

  describe.each([
    ['ESM', esm],
    ['CJS', cjs],
  ])('- %s', (_, mod) => {
    it('should expose only the public API', () => {
      expect(Object.keys(mod).sort()).toEqual(['getNumberSeparators'])
    })

    it('should return separators from getNumberSeparators when given a locale', () => {
      expect(mod.getNumberSeparators('en-GB')).toEqual({ thousandsSeparator: ',', decimalSeparator: '.' })
    })
  })
})
