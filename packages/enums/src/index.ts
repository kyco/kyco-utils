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
 */
export const zUserLocale = z.enum(UserLocale)

export type UserLocale = z.infer<typeof zUserLocale>
