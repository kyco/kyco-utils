import type { ColorMode as ColorModeType, SupportedLocale as SupportedLocaleType } from '@kyco-utils/types'
import * as z from 'zod'

// -------------------------------------------------------

/**
 * Colour modes a user can choose for the UI.
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
} as const satisfies Record<string, ColorModeType>

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

export type ColorMode = ColorModeType

// -------------------------------------------------------

/**
 * Locales supported across kyco-utils.
 *
 * @enum
 * @example
 * ```ts
 * import { SupportedLocale } from '@kyco-utils/enums'
 *
 * const locale: SupportedLocale = SupportedLocale.EN_US // 'en-US'
 * ```
 */
export const SupportedLocale = {
  // @locale-updates
  EN_US: 'en-US',
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
} as const satisfies Record<string, SupportedLocaleType>

/**
 * Zod schema that validates a {@link SupportedLocale}.
 *
 * @group Schemas
 * @example
 * ```ts
 * import { zSupportedLocale } from '@kyco-utils/enums'
 *
 * zSupportedLocale.parse('en-GB') // 'en-GB'
 * zSupportedLocale.safeParse('fr-FR').success // false
 *
 * // Build an app-specific subset:
 * const zUserLocale = z.enum([SupportedLocale.EN_GB])
 * ```
 */
export const zSupportedLocale = z.enum(SupportedLocale)

export type SupportedLocale = SupportedLocaleType
