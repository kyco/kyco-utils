import type { ColorMode as ColorModeType, SupportedLocale as SupportedLocaleType } from '@kyco-utils/types'
import { describe, expect, expectTypeOf, it } from 'vite-plus/test'

import { ColorMode, SupportedLocale, zColorMode, zSupportedLocale } from './index'

describe('+ @kyco-utils/enums', () => {
  describe('- ColorMode', () => {
    it('should expose the supported color modes', () => {
      expect(Object.values(ColorMode)).toEqual(['system', 'light', 'dark'])
    })

    it('should cover exactly the ColorMode type from @kyco-utils/types', () => {
      expectTypeOf<(typeof ColorMode)[keyof typeof ColorMode]>().toEqualTypeOf<ColorModeType>()
    })

    it('should parse valid color modes', () => {
      expect(zColorMode.parse('light')).toBe('light')
      expect(zColorMode.parse(ColorMode.DARK)).toBe('dark')
    })

    it('should reject unknown color modes', () => {
      expect(zColorMode.safeParse('sepia').success).toBe(false)
    })
  })

  describe('- SupportedLocale', () => {
    it('should expose the supported locales', () => {
      expect(Object.values(SupportedLocale)).toEqual(['en-GB', 'de-DE'])
    })

    it('should cover exactly the SupportedLocale type from @kyco-utils/types', () => {
      expectTypeOf<(typeof SupportedLocale)[keyof typeof SupportedLocale]>().toEqualTypeOf<SupportedLocaleType>()
    })

    it('should parse valid locales', () => {
      expect(zSupportedLocale.parse('en-GB')).toBe('en-GB')
      expect(zSupportedLocale.parse(SupportedLocale.DE_DE)).toBe('de-DE')
    })

    it('should reject unknown locales', () => {
      expect(zSupportedLocale.safeParse('fr-FR').success).toBe(false)
    })
  })
})
