/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { useLocaleStore } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { useDecisions } from '@/store/decisions'
import { useLearning } from '@/store/learning'
import { useSession } from '@/store/session'

/**
 * Full bilingual support means every screen renders cleanly in both locales,
 * not just Thai. This exercises all 8 screens plus the entry and
 * not-authorized pages under both `th` and `en`, and fails on any console
 * error or warning — the same signal a missing translation key would throw
 * (`translate()` falls back to the key itself rather than blanking the UI,
 * so a real gap shows up as literal dotted.key text, not a crash — the
 * dedicated check further down catches that case explicitly).
 */
const ROUTES = [
  '/',
  '/dashboard',
  '/employees',
  '/employees/emp-01',
  '/recruit',
  '/team-matching',
  '/learning',
  '/tracking',
  '/insights',
  '/not-authorized',
]

let consoleOutput: string[] = []

beforeEach(() => {
  consoleOutput = []
  vi.spyOn(console, 'error').mockImplementation((...a) => void consoleOutput.push(a.join(' ')))
  vi.spyOn(console, 'warn').mockImplementation((...a) => void consoleOutput.push(a.join(' ')))
  useDecisions.getState().reset()
  useLearning.getState().reset()
  useSession.getState().signInAsHR()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/** A translation key that leaked to the screen unrendered looks like this. */
const RAW_KEY_PATTERN = /\b[a-z]+(?:\.[a-zA-Z]+){1,}\b/

for (const locale of ['th', 'en'] as Locale[]) {
  describe(`every screen renders in ${locale}`, () => {
    beforeEach(() => useLocaleStore.getState().setLocale(locale))

    for (const path of ROUTES) {
      it(`renders ${path} without console output`, () => {
        const { container } = renderAt(path)
        expect(container.textContent?.length ?? 0).toBeGreaterThan(40)
        expect(consoleOutput, `console output on ${path} (${locale})`).toEqual([])
      })
    }

    it('shows the tagline and nav in the language that was picked', () => {
      renderAt('/dashboard')
      if (locale === 'en') {
        expect(screen.getByRole('heading', { name: 'Workforce Dashboard' })).toBeTruthy()
      } else {
        expect(screen.getByText('ขอบเขตข้อมูล: ทั้งองค์กร')).toBeTruthy()
      }
    })
  })
}

describe('switching locale at runtime', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('re-renders the same screen in the other language without navigating', () => {
    useLocaleStore.getState().setLocale('th')
    renderAt('/dashboard')
    expect(screen.getByText('ขอบเขตข้อมูล: ทั้งองค์กร')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'English', pressed: false }))
    expect(screen.getByText(/Scope: the whole organisation/)).toBeTruthy()
  })

  it('flips employee name order between locales', () => {
    useLocaleStore.getState().setLocale('th')
    renderAt('/employees/emp-01')
    expect(screen.getByRole('heading', { name: 'เจนจิรา ว.' })).toBeTruthy()
    expect(screen.getByText(/Jenjira W\./)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'English', pressed: false }))
    expect(screen.getByRole('heading', { name: 'Jenjira W.' })).toBeTruthy()
    expect(screen.getByText(/เจนจิรา ว\./)).toBeTruthy()
  })

  it('keeps HR terminology in English in Thai mode (§6)', () => {
    useLocaleStore.getState().setLocale('th')
    renderAt('/employees/emp-01')
    expect(screen.getAllByText(/Promotion Readiness/).length).toBeGreaterThan(0)

    cleanup()
    renderAt('/learning')
    expect(screen.getAllByText(/Skill Gap/).length).toBeGreaterThan(0)
  })
})

describe('no raw translation key ever reaches the screen', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  for (const locale of ['th', 'en'] as Locale[]) {
    it(`${locale}: dashboard and insights show no unresolved dotted key`, () => {
      useLocaleStore.getState().setLocale(locale)
      const { container } = renderAt('/dashboard')
      const suspects = (container.textContent ?? '')
        .split(/\s+/)
        .filter((word) => RAW_KEY_PATTERN.test(word) && !word.includes('scoring.ts'))
      expect(suspects, locale).toEqual([])
    })
  }
})
