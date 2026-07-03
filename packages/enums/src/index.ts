import * as z from 'zod'

// -------------------------------------------------------

/**
 * Supported color modes available.
 */
export const ColorMode = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const

export const zColorMode = z.enum([ColorMode.SYSTEM, ColorMode.LIGHT, ColorMode.DARK] as const)

export type ColorMode = z.infer<typeof zColorMode>

// -------------------------------------------------------

/**
 * Supported locales available. Follows [BCP 47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag) language tags,
 * i.e. generally in the format of `{ISO 639-1}-{ISO 3166-1}`.
 */
export const UserLocale = {
  // @locale-updates
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
} as const

export const zUserLocale = z.enum(UserLocale)

export type UserLocale = z.infer<typeof zUserLocale>

// -------------------------------------------------------
