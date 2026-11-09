/**
 * Thousands and decimal separators used to format a number.
 *
 * @example
 * ```ts
 * import type { NumberSeparators } from '@kyco-utils/types'
 *
 * const separators: NumberSeparators = {
 *   thousandsSeparator: '.',
 *   decimalSeparator: ',',
 * }
 * ```
 */
export type NumberSeparators = {
  /** Separates groups of digits, e.g. `,` in `12,345`. */
  thousandsSeparator: string
  /** Separates the integer from the fraction, e.g. `.` in `12.5`. */
  decimalSeparator: string
}

/**
 * Locales supported across kyco-utils. Uses [BCP 47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag)
 * language tags in the form `{language}-{region}`, where `{language}` is an
 * [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) code and
 * `{region}` is an [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes) code.
 * For a runtime enum and Zod schema, see `SupportedLocale` and `zSupportedLocale` in `@kyco-utils/enums`.
 *
 * @example
 * ```ts
 * import type { SupportedLocale } from '@kyco-utils/types'
 *
 * const locale: SupportedLocale = 'de-DE'
 * ```
 */
// @locale-updates
export type SupportedLocale = 'en-GB' | 'de-DE'

/**
 * Color modes a user can choose for the UI.
 * For a runtime enum and Zod schema, see `ColorMode` and `zColorMode` in `@kyco-utils/enums`.
 *
 * @example
 * ```ts
 * import type { ColorMode } from '@kyco-utils/types'
 *
 * const mode: ColorMode = 'dark'
 * ```
 */
export type ColorMode = 'system' | 'light' | 'dark'
