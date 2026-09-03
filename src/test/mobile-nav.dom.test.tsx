/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { useLocaleStore } from '@/lib/i18n'
import { useSession } from '@/store/session'

/**
 * The hamburger + drawer that stand in for the sidebar below 640px (§
 * responsive pass — the sidebar itself is `hidden lg:flex` and has no other
 * fallback). What's testable in jsdom without a real viewport: the drawer's
 * presence in the DOM, its content, and that opening/closing and navigating
 * all update state correctly — not anything about the CSS breakpoints
 * themselves, which need a real browser.
 */
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('the mobile nav drawer', () => {
  beforeEach(() => {
    // Thai is the app's default (§6); the assertions below read English
    // strings, since that's what's stable to write a test against rather
    // than transcribing the Thai dictionary.
    useLocaleStore.getState().setLocale('en')
    useSession.getState().signInAsHR()
  })

  it('is closed until the hamburger is pressed', () => {
    renderAt('/dashboard')
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('carries every screen the signed-in role can open', () => {
    renderAt('/dashboard')
    fireEvent.click(screen.getByLabelText('Open menu'))

    const dialog = within(screen.getByRole('dialog'))
    for (const label of ['Workforce Dashboard', 'AI Recruit', 'Tracking']) {
      expect(dialog.getByText(label)).toBeTruthy()
    }
  })

  it('carries the role and language switchers, since the header has no room for them at this width', () => {
    renderAt('/dashboard')
    fireEvent.click(screen.getByLabelText('Open menu'))

    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByText('Role')).toBeTruthy()
    expect(dialog.getByLabelText('Language')).toBeTruthy()
  })

  it('closes on its own close button', async () => {
    renderAt('/dashboard')
    fireEvent.click(screen.getByLabelText('Open menu'))
    expect(screen.getByRole('dialog')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Close menu'))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('closes when a nav link is followed', async () => {
    renderAt('/dashboard')
    fireEvent.click(screen.getByLabelText('Open menu'))

    const dialog = within(screen.getByRole('dialog'))
    fireEvent.click(dialog.getByText('Tracking'))

    // App.tsx wraps its routes in `AnimatePresence mode="wait"`, so the new
    // screen doesn't mount until the dashboard's own exit animation finishes
    // — same reason the constellation's click-through test awaits its route
    // change rather than asserting it synchronously.
    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'Tracking' })).toBeTruthy(),
      { timeout: 8000 },
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('has no hamburger on the entry screen, which has no role and no nav', () => {
    useSession.getState().signOut()
    renderAt('/')
    expect(screen.queryByLabelText('Open menu')).toBeNull()
  })
})
