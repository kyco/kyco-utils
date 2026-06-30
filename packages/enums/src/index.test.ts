import { describe, expect, it } from 'vitest'
import { UserLocale, zUserLocale } from './index'

describe('UserLocale', () => {
  it('exposes the supported locales', () => {
    expect(Object.values(UserLocale)).toEqual(['en-GB', 'de-DE'])
  })

  it('parses valid locales', () => {
    expect(zUserLocale.parse('en-GB')).toBe('en-GB')
    expect(zUserLocale.parse(UserLocale.DE_DE)).toBe('de-DE')
  })

  it('rejects unknown locales', () => {
    expect(zUserLocale.safeParse('fr-FR').success).toBe(false)
  })
})
