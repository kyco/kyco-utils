import { describe, expectTypeOf, it } from 'vite-plus/test'

import type { NumberSeparators } from './index'

describe('+ @kyco-utils/types', () => {
  describe('- NumberSeparators', () => {
    it('should have exactly the thousands and decimal separators as strings', () => {
      expectTypeOf<NumberSeparators>().toEqualTypeOf<{ thousandsSeparator: string; decimalSeparator: string }>()
    })
  })
})
