import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

/**
 * Gets the thousands and decimal separators for a given locale
 *
 * @param locale - A supported {@link UserLocale} (BCP 47 language tag).
 * @returns The {@link NumberSeparators} for the locale.
 * @see {@link UserLocale} for the list of supported locales.
 */
export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  // @locale-updates
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  return { thousandsSeparator, decimalSeparator }
}
