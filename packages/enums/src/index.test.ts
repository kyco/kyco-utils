import { describe, expect, it } from 'vite-plus/test'

import { ColorMode, UserLocale, zColorMode, zUserLocale } from './index'

describe('+ @kyco-utils/enums', () => {
  describe('- ColorMode', () => {
    it('should expose the supported color modes', () => {
      expect(Object.values(ColorMode)).toEqual(['system', 'light', 'dark'])
    })

    it('should parse valid color modes', () => {
      expect(zColorMode.parse('light')).toBe('light')
      expect(zColorMode.parse(ColorMode.DARK)).toBe('dark')
    })

    it('should reject unknown color modes', () => {
      expect(zColorMode.safeParse('sepia').success).toBe(false)
    })
  })

  describe('- UserLocale', () => {
    it('should expose the supported locales', () => {
      expect(Object.values(UserLocale)).toEqual(['en-GB', 'de-DE'])
    })

    it('should parse valid locales', () => {
      expect(zUserLocale.parse('en-GB')).toBe('en-GB')
      expect(zUserLocale.parse(UserLocale.DE_DE)).toBe('de-DE')
    })

    it('should reject unknown locales', () => {
      expect(zUserLocale.safeParse('fr-FR').success).toBe(false)
    })
  })
})
