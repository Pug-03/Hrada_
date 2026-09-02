/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { useSession } from '@/store/session'

/**
 * §14.11 — prefers-reduced-motion is respected. Every screen is rendered a
 * second time with the media query reporting true, so the reduced branches
 * are executed rather than merely written: a guard that throws or a component
 * that only works on the animated path fails here.
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

/**
 * Framer Motion logs an informational notice when reduced motion is active.
 * That is the library confirming the setting was seen, not a defect, so it is
 * the one allowed line.
 */
const FRAMER_REDUCED_MOTION_NOTICE = /Reduced Motion enabled on your device/

let consoleOutput: string[] = []

beforeEach(() => {
  consoleOutput = []
  const capture = (...args: unknown[]) => {
    const line = args.map(String).join(' ')
    if (!FRAMER_REDUCED_MOTION_NOTICE.test(line)) consoleOutput.push(line)
  }
  vi.spyOn(console, 'error').mockImplementation(capture)
  vi.spyOn(console, 'warn').mockImplementation(capture)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
  useSession.getState().signInAsHR()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reduced motion', () => {
  for (const path of ROUTES) {
    it(`${path} renders with motion reduced`, () => {
      const { container } = render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      )
      expect(container.textContent?.length ?? 0).toBeGreaterThan(40)
      expect(consoleOutput, `console output on ${path}`).toEqual([])
    })
  }

  it('strips non-essential motion in the stylesheet as a backstop', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('animation-duration: 0.01ms !important')
  })
})
