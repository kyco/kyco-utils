import * as z from 'zod'

// -------------------------------------------------------

/**
 * Supported color modes available.
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
 * Zod schema for {@link ColorMode}.
 *
 * @group Schemas
 *
 * @example
 * ```ts
 * import { zColorMode } from '@kyco-utils/enums'
 *
 * zColorMode.parse('dark') // 'dark'
 * zColorMode.safeParse('blue').success // false
 * ```
 */
export const zColorMode = z.enum([ColorMode.SYSTEM, ColorMode.LIGHT, ColorMode.DARK] as const)

export type ColorMode = z.infer<typeof zColorMode>

// -------------------------------------------------------

/**
 * Supported locales available. Follows [BCP 47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag) language tags,
 * i.e. generally in the format of `{ISO 639-1}-{ISO 3166-1}`.
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
 * Zod schema for {@link UserLocale}.
 *
 * @group Schemas
 *
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
