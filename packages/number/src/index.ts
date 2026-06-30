import type { UserLocale } from '@kyco-utils/enums'
import type { NumberSeparators } from '@kyco-utils/types'

export const getNumberSeparators = (locale: UserLocale): NumberSeparators => {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const thousandsSeparator = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  return { thousandsSeparator, decimalSeparator }
}
