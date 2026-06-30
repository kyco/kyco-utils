import { describe, expect, it } from 'vitest'

import { getNumberSeparators } from './index'

describe('getNumberSeparators', () => {
  it('returns en-GB separators', () => {
    expect(getNumberSeparators('en-GB')).toEqual({
      thousandsSeparator: ',',
      decimalSeparator: '.',
    })
  })

  it('returns de-DE separators', () => {
    expect(getNumberSeparators('de-DE')).toEqual({
      thousandsSeparator: '.',
      decimalSeparator: ',',
    })
  })
})
