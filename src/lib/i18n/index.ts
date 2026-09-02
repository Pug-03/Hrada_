import { EMPLOYEES } from '@/data/employees'

import { en, type TranslationKey } from './en'
import { useLocaleStore } from './locale'
import { th } from './th'
import type { Locale, LocalizedText, Message } from './types'

export type { Locale, LocalizedText, Message } from './types'
export type { TranslationKey } from './en'
export { LOCALES, bi } from './types'
export { useLocaleStore } from './locale'

const DICTIONARIES: Record<Locale, Record<TranslationKey, string>> = { en, th }

export type Params = Record<string, string | number>

const PLACEHOLDER = /\{(\w+)\}/g

/**
 * Look a key up and fill its placeholders.
 *
 * A missing key cannot happen through the typed API — th.ts is a complete
 * record of en.ts — but the runtime fallback returns the key itself rather
 * than an empty string, so a gap introduced through a cast is visible on
 * screen instead of silently blank.
 */
export function translate(locale: Locale, key: TranslationKey, params?: Params): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key
  if (!params) return template
  return template.replace(PLACEHOLDER, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  )
}

export type TFunction = (key: TranslationKey, params?: Params) => string

/** The active locale. */
export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale)
}

export function useSetLocale(): (locale: Locale) => void {
  return useLocaleStore((s) => s.setLocale)
}

/** The translator bound to the active locale. */
export function useT(): TFunction {
  const locale = useLocale()
  return (key, params) => translate(locale, key, params)
}

/** Both at once, for components that need the locale itself as well. */
export function useI18n(): { t: TFunction; locale: Locale } {
  const locale = useLocale()
  return { locale, t: (key, params) => translate(locale, key, params) }
}

/** Resolve a piece of bilingual content. */
export function useText(): (text: LocalizedText) => string {
  const locale = useLocale()
  return (text) => text[locale]
}

export function textIn(text: LocalizedText, locale: Locale): string {
  return text[locale]
}

// ── names ───────────────────────────────────────────────────────────────────

export interface Nameable {
  name: string
  nameLatin: string
}

/**
 * §5 of the bilingual brief — Thai mode leads with the Thai name and keeps the
 * Latin form as the secondary; English mode flips them. The person is the same
 * either way, so both forms stay available in both locales.
 */
export function primaryName(person: Nameable, locale: Locale): string {
  return locale === 'th' ? person.name : person.nameLatin
}

export function secondaryName(person: Nameable, locale: Locale): string {
  return locale === 'th' ? person.nameLatin : person.name
}

export function useName(): (person: Nameable) => string {
  const locale = useLocale()
  return (person) => primaryName(person, locale)
}

// ── messages from the scoring layer ─────────────────────────────────────────

/**
 * Render a Message the scoring engine produced.
 *
 * Scoring never knows anybody's name — it emits ids. Any parameter whose key
 * ends in `Id` is resolved through `resolveName` and offered to the template
 * under the same name without the suffix, so `{ employeeId: 'emp-02' }` fills
 * a `{employee}` placeholder with whichever form of the name the locale wants.
 */
export function renderMessage(
  message: Message<TranslationKey>,
  t: TFunction,
  resolveName?: (id: string) => string,
): string {
  const params: Params = { ...(message.params ?? {}) }
  if (resolveName) {
    for (const [key, value] of Object.entries(params)) {
      if (!key.endsWith('Id') || typeof value !== 'string') continue
      params[key.slice(0, -2)] = resolveName(value)
    }
  }
  return t(message.id, params)
}

export function useMessage(): (message: Message<TranslationKey>) => string {
  const t = useT()
  const resolve = useNameResolver()
  return (message) => renderMessage(message, t, resolve)
}

/**
 * Employee id to display name, in the active locale. It lives here rather than
 * in the data layer because which form leads is a language decision.
 *
 * The data modules import from ./types rather than from this file, so pulling
 * EMPLOYEES in here does not close a cycle.
 */
const NAME_INDEX = new Map<string, Nameable>(EMPLOYEES.map((e) => [e.id, e]))

export function nameOf(id: string, locale: Locale): string {
  const employee = NAME_INDEX.get(id)
  return employee ? primaryName(employee, locale) : id
}

export function useNameResolver(): (id: string) => string {
  const locale = useLocale()
  return (id) => nameOf(id, locale)
}
