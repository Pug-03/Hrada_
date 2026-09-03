/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Candidate } from '@/data/types'
import { useLocaleStore } from '@/lib/i18n'

import { ResumeDropZone } from './ResumeDropZone'

// Thai is the app's default (§6); these assertions read English strings,
// since that's what's stable to write a test against.
beforeEach(() => useLocaleStore.getState().setLocale('en'))
afterEach(cleanup)

const JOB_ID = 'job-senior-data-analyst'

describe('ResumeDropZone', () => {
  it('shows the label, accepted formats, sample button, and the honest disclaimer', () => {
    render(<ResumeDropZone jobId={JOB_ID} draw={0} onResult={() => {}} />)
    expect(screen.getByText('Drop a resume/CV here, or click to browse')).toBeTruthy()
    expect(screen.getByText('PDF or DOCX')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Try a sample resume' })).toBeTruthy()
    expect(
      screen.getByText('Demo simulation — production version connects to a real AI resume parser'),
    ).toBeTruthy()
  })

  it('plays the themed loading state, then resolves to a candidate for the given job', async () => {
    const onResult = vi.fn<(c: Candidate) => void>()
    render(<ResumeDropZone jobId={JOB_ID} draw={0} onResult={onResult} />)

    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText(/Analysing resume/)).toBeTruthy()

    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1), { timeout: 5000 })

    const candidate = onResult.mock.calls[0][0]
    expect(candidate.appliedJobId).toBe(JOB_ID)
    expect(candidate.id).toMatch(/^cand-resume-/)
    expect(candidate.skills.length).toBeGreaterThan(0)
    for (const skill of candidate.skills) {
      expect(skill.extractedFrom?.en).toBeTruthy()
    }
  })

  it('resolves a different sample on a later draw for the same job', async () => {
    const first = vi.fn<(c: Candidate) => void>()
    const { unmount } = render(<ResumeDropZone jobId={JOB_ID} draw={0} onResult={first} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    await waitFor(() => expect(first).toHaveBeenCalledTimes(1), { timeout: 5000 })
    unmount()

    const second = vi.fn<(c: Candidate) => void>()
    render(<ResumeDropZone jobId={JOB_ID} draw={1} onResult={second} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try a sample resume' }))
    await waitFor(() => expect(second).toHaveBeenCalledTimes(1), { timeout: 5000 })

    expect(second.mock.calls[0][0].name).not.toBe(first.mock.calls[0][0].name)
  })

  it('also triggers analysis on a real drop, not just the sample button', async () => {
    const onResult = vi.fn<(c: Candidate) => void>()
    render(<ResumeDropZone jobId={JOB_ID} draw={0} onResult={onResult} />)

    fireEvent.drop(screen.getByRole('button', { name: 'Drop a resume/CV here, or click to browse' }))

    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1), { timeout: 5000 })
    expect(onResult.mock.calls[0][0].appliedJobId).toBe(JOB_ID)
  })
})
