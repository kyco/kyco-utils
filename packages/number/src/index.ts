import type { NumberSeparators, SupportedLocale } from '@kyco-utils/types'

const SAMPLE_NUMBER = 1234567.8
const DEFAULT_THOUSANDS_SEPARATOR = ','
const DEFAULT_DECIMAL_SEPARATOR = '.'

/**
 * Returns the thousands and decimal separators for a locale, as used by `Intl.NumberFormat`.
 * Falls back to `,` and `.` if the locale doesn't define one.
 *
 * @param locale - The {@link SupportedLocale} to get separators for.
 * @returns The {@link NumberSeparators} for the locale.
 * @example
 * ```ts
 * import { getNumberSeparators } from '@kyco-utils/number'
 *
 * getNumberSeparators('en-GB') // { thousandsSeparator: ',', decimalSeparator: '.' }
 * getNumberSeparators('de-DE') // { thousandsSeparator: '.', decimalSeparator: ',' }
 * ```
 */
export const getNumberSeparators = (locale: SupportedLocale): NumberSeparators => {
  // @locale-updates
  const parts = new Intl.NumberFormat(locale).formatToParts(SAMPLE_NUMBER)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? DEFAULT_THOUSANDS_SEPARATOR
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? DEFAULT_DECIMAL_SEPARATOR

  return { thousandsSeparator, decimalSeparator }
}
