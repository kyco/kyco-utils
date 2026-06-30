import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

/**
 * Returns the thousands and decimal separators for a given locale, derived from
 * `Intl.NumberFormat`. Falls back to `,` / `.` if a part is unavailable.
 *
 * @example
 * getNumberSeparators('de-DE') // { thousandsSeparator: '.', decimalSeparator: ',' }
 */
export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  return { thousandsSeparator, decimalSeparator }
}
