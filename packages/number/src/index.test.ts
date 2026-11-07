import { describe, expect, it } from 'vite-plus/test'

import { getNumberSeparators } from './index'

describe('+ @kyco-utils/number', () => {
  describe('- getNumberSeparators', () => {
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
  })
})
