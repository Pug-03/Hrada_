import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { persistedStorage } from '@/store/storage'

import type { Locale } from './types'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

/**
 * Thai is the default, matching §6 and the behaviour the product shipped with.
 * Persisted like the rest of the session state, so a chosen language survives
 * a refresh during a demo.
 */
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'th',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'hrada-locale', storage: persistedStorage<LocaleState>() },
  ),
)
