import { Languages } from 'lucide-react'

import { LOCALES, useLocale, useSetLocale, useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'

/**
 * Runtime language switch, next to the role switcher. Unlike the role
 * switcher this never navigates — the same screen just re-renders in the
 * other language, because permissions depend on role, not on language.
 */
export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT()

  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-line bg-panel px-1 py-1"
      role="group"
      aria-label={t('locale.label')}
    >
      <Languages size={13} className="ml-1 text-haze" aria-hidden />
      {LOCALES.map((option) => (
        <button
          key={option}
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={cn(
            'rounded-md px-2 py-1 text-micro transition-colors duration-150',
            locale === option ? 'bg-signal/20 text-text' : 'text-haze hover:text-text',
          )}
        >
          {t(`locale.${option}`)}
        </button>
      ))}
    </div>
  )
}
