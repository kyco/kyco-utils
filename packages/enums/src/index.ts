import { z } from 'zod'

/**
 * Supported user locales as BCP 47 language tags.
 */
export const UserLocale = {
  EN_GB: 'en-GB',
  DE_DE: 'de-DE',
} as const

/**
 * Zod schema for {@link UserLocale}.
 *
 * Requires Zod v4, where `z.enum()` accepts an object literal. On Zod v3 the
 * equivalent would be `z.nativeEnum(UserLocale)`.
 */
export const zUserLocale = z.enum(UserLocale)

export type UserLocale = z.infer<typeof zUserLocale>
