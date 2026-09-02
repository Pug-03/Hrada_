import { describe, expect, it } from 'vitest'

import { EMPLOYEES } from '@/data/employees'
import {
  DIMMED_OPACITY,
  edgeEmphasis,
  edgeTouches,
  layoutConstellation,
  magnetOffset,
  MAGNET_MAX_PULL,
  MAGNET_RADIUS,
  neighbourIds,
  nodeEmphasis,
  VIEW,
} from './constellation'

const layout = layoutConstellation(EMPLOYEES)

describe('layout', () => {
  it('places every employee inside the viewBox', () => {
    expect(layout.nodes).toHaveLength(EMPLOYEES.length)
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(node.r)
      expect(node.x).toBeLessThanOrEqual(VIEW.width - node.r)
      expect(node.y).toBeGreaterThanOrEqual(node.r)
      expect(node.y).toBeLessThanOrEqual(VIEW.height - node.r)
    }
  })

  it('is deterministic — the same people always give the same picture', () => {
    const again = layoutConstellation(EMPLOYEES)
    expect(again.nodes.map((n) => [n.id, n.x, n.y])).toEqual(
      layout.nodes.map((n) => [n.id, n.x, n.y]),
    )
  })

  it('leaves no two nodes overlapping at rest', () => {
    for (let i = 0; i < layout.nodes.length; i++) {
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const a = layout.nodes[i]
        const b = layout.nodes[j]
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(a.r + b.r)
      }
    }
  })
})

describe('magnetOffset', () => {
  const node = { x: 400, y: 260 }

  it('ignores a cursor outside the radius', () => {
    expect(magnetOffset(node, node.x + MAGNET_RADIUS, node.y)).toEqual({ dx: 0, dy: 0 })
    expect(magnetOffset(node, node.x + MAGNET_RADIUS + 50, node.y)).toEqual({ dx: 0, dy: 0 })
  })

  it('pulls toward the cursor, never away from it', () => {
    const right = magnetOffset(node, node.x + 40, node.y)
    expect(right.dx).toBeGreaterThan(0)
    const up = magnetOffset(node, node.x, node.y - 40)
    expect(up.dy).toBeLessThan(0)
  })

  it('never exceeds the maximum pull', () => {
    for (let px = 0; px <= VIEW.width; px += 7) {
      for (let py = 0; py <= VIEW.height; py += 7) {
        const { dx, dy } = magnetOffset(node, px, py)
        expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(MAGNET_MAX_PULL + 1e-9)
      }
    }
  })

  it('falls off with distance', () => {
    const near = magnetOffset(node, node.x + 30, node.y)
    const far = magnetOffset(node, node.x + 120, node.y)
    expect(near.dx).toBeGreaterThan(far.dx)
  })

  it('scales with strength and stops entirely at zero', () => {
    const full = magnetOffset(node, node.x + 40, node.y, 1)
    const half = magnetOffset(node, node.x + 40, node.y, 0.5)
    expect(half.dx).toBeCloseTo(full.dx / 2, 6)
    expect(magnetOffset(node, node.x + 40, node.y, 0)).toEqual({ dx: 0, dy: 0 })
  })

  it('never overshoots a cursor sitting almost on the node', () => {
    const { dx } = magnetOffset(node, node.x + 2, node.y)
    expect(dx).toBeLessThanOrEqual(2)
  })

  it('treats a missing pointer as no pull', () => {
    expect(magnetOffset(node, Number.NaN, Number.NaN)).toEqual({ dx: 0, dy: 0 })
  })
})

describe('drift never breaks the picture', () => {
  /**
   * The whole field is displaced for a grid of cursor positions and checked
   * for collisions. This is the guarantee the interaction rests on: nodes may
   * lean toward the cursor, but two people must never end up on top of each
   * other, and nobody may drift out of their department's cluster.
   */
  const positions: { x: number; y: number }[] = []
  for (let x = 0; x <= VIEW.width; x += 25) {
    for (let y = 0; y <= VIEW.height; y += 25) positions.push({ x, y })
  }

  it('keeps every pair of nodes apart at every cursor position', () => {
    let worstGap = Infinity
    for (const pointer of positions) {
      const displaced = layout.nodes.map((node) => {
        const { dx, dy } = magnetOffset(node, pointer.x, pointer.y)
        return { ...node, x: node.x + dx, y: node.y + dy }
      })
      for (let i = 0; i < displaced.length; i++) {
        for (let j = i + 1; j < displaced.length; j++) {
          const a = displaced[i]
          const b = displaced[j]
          worstGap = Math.min(worstGap, Math.hypot(b.x - a.x, b.y - a.y) - (a.r + b.r))
        }
      }
    }
    expect(worstGap).toBeGreaterThan(0)
  })

  it('keeps everyone nearer their own department than any other', () => {
    const centroid = (department: string, nodes: typeof layout.nodes) => {
      const members = nodes.filter((n) => n.department === department)
      return {
        x: members.reduce((s, n) => s + n.x, 0) / members.length,
        y: members.reduce((s, n) => s + n.y, 0) / members.length,
      }
    }
    const restCentroids = new Map(
      layout.departments.map((d) => [d, centroid(d, layout.nodes)] as const),
    )

    for (const pointer of positions) {
      for (const node of layout.nodes) {
        const { dx, dy } = magnetOffset(node, pointer.x, pointer.y)
        const own = restCentroids.get(node.department)!
        const ownDistance = Math.hypot(node.x + dx - own.x, node.y + dy - own.y)
        for (const [department, other] of restCentroids) {
          if (department === node.department) continue
          const otherDistance = Math.hypot(node.x + dx - other.x, node.y + dy - other.y)
          expect(ownDistance).toBeLessThan(otherDistance)
        }
      }
    }
  })
})

describe('hover emphasis', () => {
  const hovered = layout.nodes[0]
  const neighbours = neighbourIds(layout.edges, hovered.id)

  it('finds everyone one edge away', () => {
    expect(neighbours.size).toBeGreaterThan(0)
    expect(neighbours.has(hovered.id)).toBe(false)
    for (const id of neighbours) {
      expect(
        layout.edges.some(
          (e) => (e.a === hovered.id && e.b === id) || (e.b === hovered.id && e.a === id),
        ),
      ).toBe(true)
    }
  })

  it('leaves everything at full strength when nothing is hovered', () => {
    for (const node of layout.nodes) {
      expect(nodeEmphasis(node.id, null, null).opacity).toBe(1)
    }
  })

  it('keeps the hovered node and its neighbours lit', () => {
    expect(nodeEmphasis(hovered.id, hovered.id, neighbours)).toEqual({
      opacity: 1,
      related: true,
    })
    for (const id of neighbours) {
      expect(nodeEmphasis(id, hovered.id, neighbours).opacity).toBe(1)
    }
  })

  it('dims everyone unrelated to 30%', () => {
    const unrelated = layout.nodes.filter(
      (n) => n.id !== hovered.id && !neighbours.has(n.id),
    )
    for (const node of unrelated) {
      expect(nodeEmphasis(node.id, hovered.id, neighbours)).toEqual({
        opacity: DIMMED_OPACITY,
        related: false,
      })
    }
  })

  it('brightens connected edges and dims the rest', () => {
    for (const edge of layout.edges) {
      const strength = 0.5
      const base = edgeEmphasis(edge, strength, null)
      const hoveredValue = edgeEmphasis(edge, strength, hovered.id)
      if (edgeTouches(edge, hovered.id)) {
        expect(hoveredValue).toBe(0.55)
        expect(hoveredValue).toBeGreaterThan(base)
      } else {
        expect(hoveredValue).toBeCloseTo(base * DIMMED_OPACITY, 10)
        expect(hoveredValue).toBeLessThan(base)
      }
    }
  })

  it('draws a thicker edge for people who share more', () => {
    expect(edgeEmphasis({ a: 'x', b: 'y' }, 1, null)).toBeGreaterThan(
      edgeEmphasis({ a: 'x', b: 'y' }, 0.1, null),
    )
  })
})
