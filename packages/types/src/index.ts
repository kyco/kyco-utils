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
