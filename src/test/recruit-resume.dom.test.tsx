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
 * The Recruit-screen-specific half of the resume drop-zone: does a
 * simulated resume actually land in the ranked list and go through the same
 * explainability flow as a real candidate. The simulation itself (loading
 * state, sample selection, draw cycling) is covered by
 * ResumeDropZone.test.tsx in isolation — this is what wiring it into
 * Recruit.tsx adds on top.
 */
function renderRecruit() {
  return render(
    <MemoryRouter initialEntries={['/recruit']}>
      <App />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  useLocaleStore.getState().setLocale('en')
  useSession.getState().signInAsHR()
})
afterEach(cleanup)

describe('the resume drop-zone, wired into Recruit', () => {
  it('adds the simulated candidate to the ranked Match Score list', async () => {
    renderRecruit()
    expect(screen.queryByText('Kanokwan T.')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    expect(screen.getByText(/Analysing resume/)).toBeTruthy()

    // Kanokwan T. is the first job's (Senior Data Analyst) first draw.
    await waitFor(() => expect(screen.getByText('Kanokwan T.')).toBeTruthy(), { timeout: 5000 })
    expect(screen.getByText(/Added Kanokwan T\. to the candidate list/)).toBeTruthy()
  })

  it('opens the same "Why this match?" panel, with an Extracted from Resume section the other 8 candidates never show', async () => {
    renderRecruit()
    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    await waitFor(() => expect(screen.getByText('Kanokwan T.')).toBeTruthy(), { timeout: 5000 })

    const card = screen.getByText('Kanokwan T.').closest('li')!
    fireEvent.click(within(card).getByText('Why this match?'))

    expect(screen.getByText('Extracted from the resume')).toBeTruthy()
    // A slice of one of her four skill excerpts, verbatim — short of the
    // embedded "3", which NumericText (§14.8) splits into its own node.
    expect(
      screen.getByText(/demand-forecasting initiatives, turning raw transaction data/),
    ).toBeTruthy()
  })

  it('draws a different sample on a second resume for the same job', async () => {
    renderRecruit()
    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    await waitFor(() => expect(screen.getByText('Kanokwan T.')).toBeTruthy(), { timeout: 5000 })

    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    await waitFor(() => expect(screen.getByText('Somchai R.')).toBeTruthy(), { timeout: 5000 })

    // Both stay on the list — nothing gets replaced.
    expect(screen.getByText('Kanokwan T.')).toBeTruthy()
  })
})
