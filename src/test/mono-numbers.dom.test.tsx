/**
 * @vitest-environment jsdom
 */
import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { useSession } from '@/store/session'

/**
 * §14.8 — every number on screen uses the mono face with tabular figures.
 *
 * Rather than trusting review, this walks the rendered DOM of every screen and
 * fails on any text node containing a digit that has no `.num` ancestor. SVG
 * is excluded because chart ticks carry the mono family directly through
 * Recharts' tick props, where a class cannot reach.
 */
const ROUTES = [
  '/',
  '/dashboard',
  '/employees',
  '/employees/emp-01',
  '/employees/emp-08',
  '/recruit',
  '/team-matching',
  '/learning',
  '/tracking',
  '/insights',
  '/not-authorized',
]

const DIGIT = /\d/

function offendingText(root: HTMLElement): string[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const offenders: string[] = []
  let node = walker.nextNode()
  while (node) {
    const text = node.textContent ?? ''
    const parent = node.parentElement
    if (DIGIT.test(text) && parent && !(parent instanceof SVGElement)) {
      if (!parent.closest('.num')) offenders.push(text.trim())
    }
    node = walker.nextNode()
  }
  return offenders
}

afterEach(cleanup)

describe('every rendered digit is in the mono face', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  for (const path of ROUTES) {
    it(`${path} has no bare digits`, () => {
      const { container } = render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      )
      expect(offendingText(container), `bare digits on ${path}`).toEqual([])
    })
  }
})
