/**
 * The thousands and decimal separators used to format numbers.
 *
 * @example
 * ```ts
 * import type { NumberSeparators } from '@kyco-utils/types'
 *
 * const separators: NumberSeparators = { thousandsSeparator: '.', decimalSeparator: ',' }
 * ```
 */
export type NumberSeparators = {
  /** Groups digits, e.g. `,` in `12,345`. */
  thousandsSeparator: string
  /** Separates the fraction, e.g. `.` in `12.5`. */
  decimalSeparator: string
}
