import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

const DEFAULT_THOUSANDS_SEPARATOR = ','
const DEFAULT_DECIMAL_SEPARATOR = '.'

/**
 * Gets the thousands and decimal separators for a given locale
 *
 * @param locale - A supported {@link UserLocale} (BCP 47 language tag).
 * @returns The {@link NumberSeparators} for the locale.
 * @see {@link UserLocale} for the list of supported locales.
 *
 * @example
 * ```ts
 * import { UserLocale } from '@kyco-utils/enums'
 * import { getNumberSeparators } from '@kyco-utils/number'
 *
 * getNumberSeparators(UserLocale.EN_GB) // { thousandsSeparator: ',', decimalSeparator: '.' }
 * getNumberSeparators(UserLocale.DE_DE) // { thousandsSeparator: '.', decimalSeparator: ',' }
 * ```
 */
export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  // @locale-updates
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? DEFAULT_THOUSANDS_SEPARATOR
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? DEFAULT_DECIMAL_SEPARATOR

  return { thousandsSeparator, decimalSeparator }
}
