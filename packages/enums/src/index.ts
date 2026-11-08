import * as z from 'zod'

// -------------------------------------------------------

/**
 * Color modes a user can choose for the UI.
 *
 * @enum
 * @example
 * ```ts
 * import { ColorMode } from '@kyco-utils/enums'
 *
 * const mode: ColorMode = ColorMode.DARK // 'dark'
 * ```
 */
export const ColorMode = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} as const

/**
 * Zod schema that validates a {@link ColorMode}.
 *
 * @group Schemas
 * @example
 * ```ts
 * import { zColorMode } from '@kyco-utils/enums'
 *
 * zColorMode.parse('dark') // 'dark'
 * zColorMode.safeParse('blue').success // false
 * ```
 */
export const zColorMode = z.enum(ColorMode)

export type ColorMode = z.infer<typeof zColorMode>

// -------------------------------------------------------

/**
 * Locales supported across kyco-utils. Uses [BCP 47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag)
 * language tags in the form `{language}-{region}`, where `{language}` is an
 * [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) code and
 * `{region}` is an [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes) code.
 *
 * @enum
 * @example
 * ```ts
 * import { UserLocale } from '@kyco-utils/enums'
 *
 * const locale: UserLocale = UserLocale.DE_DE // 'de-DE'
 * ```
 */
export const UserLocale = {
  // @locale-updates
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
} as const

/**
 * Zod schema that validates a {@link UserLocale}.
 *
 * @group Schemas
 * @example
 * ```ts
 * import { zUserLocale } from '@kyco-utils/enums'
 *
 * zUserLocale.parse('en-GB') // 'en-GB'
 * zUserLocale.safeParse('fr-FR').success // false
 * ```
 */
export const zUserLocale = z.enum(UserLocale)

export type UserLocale = z.infer<typeof zUserLocale>

// -------------------------------------------------------
