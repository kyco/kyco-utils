import { createRequire } from 'node:module'

import * as esm from '@kyco-utils/enums'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test: imports by package name → resolved through `exports` to the built `dist/`,
// like a real consumer. Logic is covered in `index.test.ts`.
const require = createRequire(import.meta.url)
const cjs = require('@kyco-utils/enums') as typeof esm

describe('+ @kyco-utils/enums (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(require.resolve('@kyco-utils/enums')).toMatch(/[\\/]dist[\\/]index\.cjs$/)
    expect(import.meta.resolve('@kyco-utils/enums')).toMatch(/\/dist\/index\.mjs$/)
  })

  describe.each([
    ['ESM', esm],
    ['CJS', cjs],
  ])('- %s', (_, mod) => {
    it('should expose only the public API', () => {
      expect(Object.keys(mod).sort()).toEqual(['ColorMode', 'UserLocale', 'zColorMode', 'zUserLocale'])
    })

    it('should return the value from ColorMode', () => {
      expect(mod.ColorMode.DARK).toBe('dark')
    })

    it('should return the parsed value from zColorMode when given a color mode', () => {
      expect(mod.zColorMode.parse('dark')).toBe('dark')
    })

    it('should return the value from UserLocale', () => {
      expect(mod.UserLocale.DE_DE).toBe('de-DE')
    })

    it('should return the parsed value from zUserLocale when given a locale', () => {
      expect(mod.zUserLocale.parse('de-DE')).toBe('de-DE')
    })
  })
})
