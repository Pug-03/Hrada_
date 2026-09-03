/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { EMPLOYEES } from '@/data/employees'
import { edgeTouches, layoutConstellation } from '@/lib/constellation'
import { colors } from '@/lib/theme'
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

    // A generous timeout: this waits out a real 260ms setTimeout plus a
    // route change, and a shared CI runner can be far slower than a dev
    // machine — 2000ms was tight enough to flake there even though the
    // underlying wait is well under a second in practice.
    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'ปิยะ ส.' })).toBeTruthy(),
      { timeout: 8000 },
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
      timeout: 8000,
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

describe('constellation resting state', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('gives every node a permanent idle glow, not just the hovered one', () => {
    const { container } = renderDashboard()
    expect(container.querySelectorAll('[data-idle-glow]')).toHaveLength(EMPLOYEES.length)

    // Confirm it is unaffected by hover — it is not the hover glow in disguise.
    fireEvent.mouseEnter(nodeFor(container, HOVERED))
    expect(container.querySelectorAll('[data-idle-glow]')).toHaveLength(EMPLOYEES.length)
  })

  it('scatters a decorative starfield behind the real nodes', () => {
    const { container } = renderDashboard()
    const starfield = container.querySelector('[data-constellation-starfield]')
    expect(starfield).toBeTruthy()
    const stars = starfield!.querySelectorAll('circle')
    expect(stars.length).toBeGreaterThan(20)

    // Stars carry none of the identity or interaction machinery real nodes do.
    for (const star of stars) {
      expect(star.getAttribute('data-node-id')).toBeNull()
      expect(star.getAttribute('tabindex')).toBeNull()
      expect(star.getAttribute('filter')).toBeNull()
    }
  })

  it('decorates with sky, not a second hue, and stays dimmer and smaller than a real node', () => {
    const { container } = renderDashboard()
    const starfield = container.querySelector('[data-constellation-starfield]')!
    // The group carries the colour once; individual stars vary only opacity
    // and radius. This is the sky token's own rendered value — haze or any
    // other palette colour here would mean decoration reaching outside the
    // one hue this canvas is built from.
    expect((starfield as SVGGElement).getAttribute('fill')).toBe(colors.sky)

    const stars = [...starfield.querySelectorAll('circle')]
    const realNode = container.querySelector('[data-node-id]')!
    const realRadius = Number(realNode.querySelector('circle')?.getAttribute('r'))
    for (const star of stars) {
      expect(Number(star.getAttribute('r'))).toBeLessThan(realRadius)
      expect(Number(star.getAttribute('opacity'))).toBeLessThan(0.25)
    }
  })

  it('draws the starfield behind the node layer in paint order', () => {
    const { container } = renderDashboard()
    const svg = container.querySelector('svg[role="img"]')!
    const children = [...svg.children]
    const starfieldIndex = children.findIndex((c) => c.hasAttribute('data-constellation-starfield'))
    const firstNodeGroup = children.findIndex((c) => c.matches('[data-node-id]'))
    expect(starfieldIndex).toBeGreaterThanOrEqual(0)
    expect(starfieldIndex).toBeLessThan(firstNodeGroup)
  })

  it('draws connections as curved paths, not straight lines', () => {
    const { container } = renderDashboard()
    const svg = container.querySelector('svg[role="img"]')!
    expect(svg.querySelectorAll('line').length).toBe(0)
    const edgePaths = [...svg.querySelectorAll('path')].filter((p) => p.getAttribute('stroke'))
    expect(edgePaths.length).toBeGreaterThan(0)
    for (const path of edgePaths) {
      // A quadratic curve's command is "Q"; a straight segment would use "L".
      expect(path.getAttribute('d')).toContain('Q')
    }
  })

})

/**
 * Tap-to-highlight (§ touch redesign). Coarse pointer support isn't a
 * viewport thing — it's gated on matchMedia('(pointer: coarse)') — so it's
 * exercised here by overriding the stub setup.ts installs (which always
 * reports `matches: false`) rather than by any viewport trick.
 */
describe('constellation on a coarse (touch) pointer', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    useSession.getState().signInAsHR()
    originalMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('selects a node on tap without activating it', () => {
    const { container } = renderDashboard()
    fireEvent.click(nodeFor(container, HOVERED))
    expect(screen.getByText('Data Lead')).toBeTruthy()
    // Still on the dashboard — a tap only selects, it doesn't hand off.
    expect(screen.getByRole('heading', { name: 'Workforce Dashboard' })).toBeTruthy()
  })

  it('activates the selected node from the explicit "view profile" affordance', async () => {
    const { container } = renderDashboard()
    fireEvent.click(nodeFor(container, HOVERED))
    // The dictionary default is Thai (§6) — the rest of this file already
    // reads Thai strings (e.g. the profile heading below) for that reason.
    fireEvent.click(screen.getByRole('button', { name: 'ดูโปรไฟล์' }))

    await waitFor(
      () => expect(screen.getByRole('heading', { name: 'ปิยะ ส.' })).toBeTruthy(),
      { timeout: 8000 },
    )
  })

  it('toggles the selection off on a second tap of the same node', () => {
    const { container } = renderDashboard()
    fireEvent.click(nodeFor(container, HOVERED))
    expect(screen.getByText('Data Lead')).toBeTruthy()

    fireEvent.click(nodeFor(container, HOVERED))
    expect(screen.queryByText('Data Lead')).toBeNull()
  })

  it('clears the selection on a tap on empty canvas', () => {
    const { container } = renderDashboard()
    fireEvent.click(nodeFor(container, HOVERED))
    expect(screen.getByText('Data Lead')).toBeTruthy()

    fireEvent.click(container.querySelector('svg[role="img"]')!)
    expect(screen.queryByText('Data Lead')).toBeNull()
  })
})

describe('constellation resting state — legend', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('gives each department a distinguishable identity, not just an opacity step', () => {
    const { container } = renderDashboard()
    const legendDots = [...container.querySelectorAll('.mt-2 span > span.rounded-full')]
    const colours = legendDots.map((dot) => (dot as HTMLElement).style.backgroundColor)
    expect(colours.length).toBeGreaterThanOrEqual(2)
    // The old opacity-only encoding gave every department the same rgb triple
    // and differed only in the alpha channel; asserting the full colour
    // string is distinct per department (not just present) is what actually
    // catches that regression.
    expect(new Set(colours).size).toBe(colours.length)
  })
})

