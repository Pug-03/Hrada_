/** The two locales the product ships in. */
export type Locale = 'th' | 'en'

export const LOCALES: Locale[] = ['th', 'en']

/**
 * A piece of content that exists in both languages.
 *
 * Used for data the product owns — a job description, a role's rationale, the
 * detail on a piece of evidence. UI chrome goes through the dictionaries
 * instead; this is for content that belongs to a record rather than to a
 * screen.
 */
export interface LocalizedText {
  th: string
  en: string
}

export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale]
}

/** Shorthand for writing bilingual content inline in the data files. */
export function bi(th: string, en: string): LocalizedText {
  return { th, en }
}

/**
 * A sentence the scoring engine wants said, named rather than written.
 *
 * The engine never produces prose: it returns the id of a template and the
 * values to drop into it, and the presentation layer renders that in whichever
 * locale is active. This is what keeps src/lib/scoring.ts language-agnostic.
 */
export interface Message<Id extends string = string> {
  id: Id
  params?: Record<string, string | number>
}
