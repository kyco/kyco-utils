import * as mod from '@kyco-utils/enums'
import { describe, expect, it } from 'vite-plus/test'

// Packaging smoke test: imports by package name → resolved through `exports` to the built `dist/`,
// like a real consumer. Logic is covered in `index.test.ts`.
describe('+ @kyco-utils/enums (consumer)', () => {
  it('should resolve to the built dist', () => {
    expect(import.meta.resolve('@kyco-utils/enums')).toMatch(/\/dist\/index\.mjs$/)
  })

  it('should expose only the public API', () => {
    expect(Object.keys(mod).sort()).toEqual(['ColorMode', 'SupportedLocale', 'zColorMode', 'zSupportedLocale'])
  })

  it('should return the value from ColorMode', () => {
    expect(mod.ColorMode.DARK).toBe('dark')
  })

  it('should return the parsed value from zColorMode when given a color mode', () => {
    expect(mod.zColorMode.parse('dark')).toBe('dark')
  })

  it('should return the value from SupportedLocale', () => {
    expect(mod.SupportedLocale.DE_DE).toBe('de-DE')
  })

  it('should return the parsed value from zSupportedLocale when given a locale', () => {
    expect(mod.zSupportedLocale.parse('de-DE')).toBe('de-DE')
  })
})
