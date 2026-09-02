/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('keeps the constellation hover highlight but sends no edge pulses', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    const node = container.querySelector('[data-node-id="emp-02"]')!
    fireEvent.mouseEnter(node)

    // The meaning survives — hovering still says who this is …
    expect(screen.getByText('Data Lead')).toBeTruthy()
    // … the decoration does not.
    expect(container.querySelector('[data-constellation-pulses]')).toBeNull()
  })

  it('never tilts the constellation canvas', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-tilt]')!.getAttribute('data-tilt')).toBe('off')
  })

  it('opens a profile on click with no ring to wait for', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    fireEvent.click(container.querySelector('[data-node-id="emp-02"]')!)
    // No RIPPLE_MS wait to sit through: the only delay is React's own.
    await waitFor(() => expect(screen.getByRole('heading', { name: 'ปิยะ ส.' })).toBeTruthy())
  })

  it('renders the idle glow at a fixed opacity, with no twinkle loop', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    const glow = container.querySelector('[data-idle-glow="emp-02"]') as SVGElement
    // Framer Motion writes the resolved value straight to the inline style
    // when there is nothing to loop; an active twinkle would instead leave a
    // requestAnimationFrame-driven transform with no single resting value.
    expect(glow.style.opacity).toBe('0.3')
  })

  it('keeps the decorative starfield and department colours static either way', () => {
    // Neither is animated in the first place, so reduced motion changes
    // nothing about them — this just confirms they still render.
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      container.querySelector('[data-constellation-starfield]')?.querySelectorAll('circle').length,
    ).toBeGreaterThan(20)
  })

  it('strips non-essential motion in the stylesheet as a backstop', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('animation-duration: 0.01ms !important')
  })
})
