import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

/**
 * Gets the thousands and decimal separators for a given locale
 *
 * @param locale - The locale to get separators for
 * @returns Object containing `thousandsSeparator` and `decimalSeparator`
 */
export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  // @locale-updates
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  return { thousandsSeparator, decimalSeparator }
}
