import { describe, expectTypeOf, it } from 'vite-plus/test'

import type { ColorMode, NumberSeparators, SupportedLocale } from './index'

describe('+ @kyco-utils/types', () => {
  describe('- NumberSeparators', () => {
    it('should have exactly the thousands and decimal separators as strings', () => {
      expectTypeOf<NumberSeparators>().toEqualTypeOf<{ thousandsSeparator: string; decimalSeparator: string }>()
    })
  })

  describe('- SupportedLocale', () => {
    it('should be exactly the supported locale tags', () => {
      expectTypeOf<SupportedLocale>().toEqualTypeOf<'en-US' | 'en-GB' | 'de-DE'>()
    })
  })

  describe('- ColorMode', () => {
    it('should be exactly the supported color modes', () => {
      expectTypeOf<ColorMode>().toEqualTypeOf<'system' | 'light' | 'dark'>()
    })
  })
})
