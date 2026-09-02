/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { EMPLOYEES } from '@/data/employees'
import { edgeTouches, layoutConstellation } from '@/lib/constellation'
import { useSession } from '@/store/session'

/**
 * The parts of the constellation's hover behaviour that are observable in
 * jsdom: which node is being read, and how much of the graph lights up for it.
 * The drift, the travelling pulse and the click ring are visual and are
 * covered by the pure functions in src/lib/constellation.test.ts instead.
 */
const HOVERED = 'emp-02' // Piya — the most connected person in the dataset.
const layout = layoutConstellation(EMPLOYEES)
const incidentEdges = layout.edges.filter((e) => edgeTouches(e, HOVERED)).length

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <App />
    </MemoryRouter>,
  )
}

const nodeFor = (container: HTMLElement, id: string) => {
  const node = container.querySelector(`[data-node-id="${id}"]`)
  if (!node) throw new Error(`no node for ${id}`)
  return node
}

const pulseCount = (container: HTMLElement) =>
  container.querySelector('[data-constellation-pulses]')?.childElementCount ?? 0

afterEach(cleanup)

describe('constellation hover', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('draws one node per person', () => {
    const { container } = renderDashboard()
    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(EMPLOYEES.length)
  })

  it('names the person under the cursor', () => {
    const { container } = renderDashboard()
    expect(screen.queryByText('Data Lead')).toBeNull()

    fireEvent.mouseEnter(nodeFor(container, HOVERED))
    expect(screen.getByText('Data Lead')).toBeTruthy()

    fireEvent.mouseLeave(nodeFor(container, HOVERED))
    expect(screen.queryByText('Data Lead')).toBeNull()
  })

  it('shows the workload warning in the tooltip for someone over 85%', () => {
    const { container } = renderDashboard()
    fireEvent.mouseEnter(nodeFor(container, HOVERED))
    // Piya is at 92%.
    expect(screen.getByText('Workload')).toBeTruthy()
  })

  it('sends a pulse down every edge the hovered person has, and no others', () => {
    const { container } = renderDashboard()
    expect(pulseCount(container)).toBe(0)

    fireEvent.mouseEnter(nodeFor(container, HOVERED))
    expect(incidentEdges).toBeGreaterThan(0)
    expect(pulseCount(container)).toBe(incidentEdges)

    fireEvent.mouseLeave(nodeFor(container, HOVERED))
    expect(pulseCount(container)).toBe(0)
  })

  it('is reachable by keyboard, and focus reads as hover', () => {
    const { container } = renderDashboard()
    const node = nodeFor(container, HOVERED)
    expect(node.getAttribute('tabindex')).toBe('0')
    expect(node.getAttribute('aria-label')).toContain('ปิยะ ส.')

    fireEvent.focus(node)
    expect(screen.getByText('Data Lead')).toBeTruthy()
    fireEvent.blur(node)
    expect(screen.queryByText('Data Lead')).toBeNull()
  })

  it('rings the node first, then hands off to the profile', async () => {
    const { container } = renderDashboard()
    fireEvent.click(nodeFor(container, HOVERED))

    // The ring plays on the dashboard before the route changes, which is what
    // gives the layoutId hand-off something to travel from.
    expect(screen.getByRole('heading', { name: 'Workforce Dashboard' })).toBeTruthy()

    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'ปิยะ ส.' })).toBeTruthy(),
      { timeout: 2000 },
    )
  })

  it('flattens the canvas on click, before the profile hand-off begins', async () => {
    const { container } = renderDashboard()
    const tilt = () => container.querySelector('[data-tilt]')!.getAttribute('data-tilt')
    expect(tilt()).toBe('on')

    fireEvent.click(nodeFor(container, HOVERED))
    // Flat already, while the ring is still playing and before navigation —
    // a rotated ancestor would break the layoutId projection.
    expect(tilt()).toBe('off')
    expect(screen.getByRole('heading', { name: 'Workforce Dashboard' })).toBeTruthy()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'ปิยะ ส.' })).toBeTruthy(), {
      timeout: 2000,
    })
  })

  it('clears the hover when the pointer leaves the canvas entirely', () => {
    const { container } = renderDashboard()
    fireEvent.mouseEnter(nodeFor(container, HOVERED))
    expect(screen.getByText('Data Lead')).toBeTruthy()

    const svg = container.querySelector('svg[role="img"]')!
    fireEvent.pointerLeave(svg)
    expect(screen.queryByText('Data Lead')).toBeNull()
  })
})
