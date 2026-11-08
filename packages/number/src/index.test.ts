import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { getNumberSeparators } from './index'

describe('+ @kyco-utils/number', () => {
  describe('- getNumberSeparators', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return "," and "." for en-GB', () => {
      expect(getNumberSeparators('en-GB')).toEqual({
        thousandsSeparator: ',',
        decimalSeparator: '.',
      })
    })

    it('should return "." and "," for de-DE', () => {
      expect(getNumberSeparators('de-DE')).toEqual({
        thousandsSeparator: '.',
        decimalSeparator: ',',
      })
    })

    it('should fall back to "," and "." when the locale defines no separators', () => {
      vi.spyOn(Intl.NumberFormat.prototype, 'formatToParts').mockReturnValue([{ type: 'integer', value: '1234567' }])

      expect(getNumberSeparators('de-DE')).toEqual({
        thousandsSeparator: ',',
        decimalSeparator: '.',
      })
    })
  })
})
