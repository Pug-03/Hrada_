import type { Department, Employee } from '@/data/types'
import { sharedSkillEdges, totalSkillLevel, type SkillEdge } from '@/lib/scoring'

export interface ConstellationNode {
  id: string
  employee: Employee
  x: number
  y: number
  /** Radius in view units, scaled from total skill mass. */
  r: number
  /** 0–1 brightness, same source as the radius. */
  intensity: number
  department: Department
  /** §4 — over 85% committed, so the node pulses. */
  overloaded: boolean
}

export interface ConstellationLayout {
  width: number
  height: number
  nodes: ConstellationNode[]
  edges: (SkillEdge & { from: ConstellationNode; to: ConstellationNode })[]
  /** Department order, so the first paint can stagger cluster by cluster. */
  departments: Department[]
}

/**
 * Enlarged from the original 900×520 when the roster grew from 14 to 114 —
 * five clusters of 18–30 people need real room between them, not just
 * between individual nodes within one.
 */
export const VIEW = { width: 1180, height: 700 }

/**
 * Ceiling on how far a node may travel under cursor drift. Defined here,
 * ahead of the layout algorithm, because the layout's own minimum separation
 * has to be built with this in mind: two adjacent nodes can each drift this
 * far toward each other, so "never overlap" has to hold at rest distance
 * minus twice this, not at rest distance alone. See MAGNET_RADIUS below for
 * how close the cursor must get to trigger it.
 *
 * Tuned down from an earlier 9 when the field densified from 14 to 114
 * nodes — the same "lean toward the cursor" effect, sized to a field with
 * far less open space per node.
 */
export const MAGNET_MAX_PULL = 6

/**
 * Hand-placed cluster centres, one per department, sized for the approved
 * distribution (Marketing 22, Sales 26, Data 18, Product 30, Operations 18).
 * A real force simulation drifts between reloads and reads as noise; fixed
 * anchors with local relaxation keep the composition stable while the people
 * inside a department still settle naturally. Product and Sales — the two
 * largest clusters — sit in opposite corners with the most open canvas
 * around them; the smaller Data and Operations clusters share the tighter
 * middle band.
 */
const CLUSTER_CENTRES: Record<Department, { x: number; y: number }> = {
  Marketing: { x: 270, y: 170 },
  Data: { x: 720, y: 150 },
  Product: { x: 940, y: 470 },
  Operations: { x: 560, y: 560 },
  Sales: { x: 220, y: 480 },
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * §4 — a light approximated layout. Members start on a sunflower-packed disc
 * around their department centre — radius grows with the square root of
 * index, not linearly, so area (not radius) scales with headcount, the same
 * technique the decorative starfield uses — then a fixed number of
 * relaxation passes push apart any pair that would overlap while a weak
 * spring holds each node near its cluster. Deterministic: the same data
 * always produces the same picture.
 *
 * The minimum separation enforced during relaxation reserves 2×
 * MAGNET_MAX_PULL of headroom beyond each pair's own radii, so that even if
 * cursor drift pulls two adjacent nodes maximally toward each other, they
 * still cannot touch. This is what constellation.test.ts's drift sweep
 * verifies holds for every cursor position, not just at rest.
 */
export function layoutConstellation(
  employees: Employee[],
  minLevelForEdge = 3.0,
): ConstellationLayout {
  const departments = [...new Set(employees.map((e) => e.department))].sort(
    (a, b) => Object.keys(CLUSTER_CENTRES).indexOf(a) - Object.keys(CLUSTER_CENTRES).indexOf(b),
  )

  const masses = employees.map(totalSkillLevel)
  const minMass = Math.min(...masses)
  const maxMass = Math.max(...masses)
  const massRange = maxMass - minMass || 1

  const nodes: ConstellationNode[] = []
  for (const department of departments) {
    const members = employees.filter((e) => e.department === department)
    const centre = CLUSTER_CENTRES[department] ?? { x: VIEW.width / 2, y: VIEW.height / 2 }
    // Sunflower packing: radius ∝ √(rank), angle steps by the golden angle —
    // even coverage of the disc with no clumping, area growing with N rather
    // than a single ring's circumference growing with N.
    const spacing = 14
    members.forEach((employee, i) => {
      const angle = i * GOLDEN_ANGLE + departments.indexOf(department)
      const radius = spacing * Math.sqrt(i + 0.5)
      const mass = totalSkillLevel(employee)
      const intensity = (mass - minMass) / massRange
      nodes.push({
        id: employee.id,
        employee,
        department,
        x: centre.x + Math.cos(angle) * radius,
        y: centre.y + Math.sin(angle) * radius,
        r: 6 + intensity * 8,
        intensity,
        overloaded: employee.workload > 85,
      })
    })
  }

  // Relaxation: separate overlapping nodes, keep everyone near their cluster.
  const DRIFT_HEADROOM = MAGNET_MAX_PULL * 2
  const PASSES = 140
  for (let pass = 0; pass < PASSES; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 0.001
        const minDistance = a.r + b.r + 14 + DRIFT_HEADROOM
        if (distance >= minDistance) continue
        const push = (minDistance - distance) / 2
        const ux = dx / distance
        const uy = dy / distance
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
      }
    }
    for (const node of nodes) {
      const centre = CLUSTER_CENTRES[node.department]
      node.x += (centre.x - node.x) * 0.015
      node.y += (centre.y - node.y) * 0.015
      node.x = Math.min(VIEW.width - node.r - 12, Math.max(node.r + 12, node.x))
      node.y = Math.min(VIEW.height - node.r - 12, Math.max(node.r + 12, node.y))
    }
  }

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const edges = sharedSkillEdges(employees, minLevelForEdge)
    .map((edge) => {
      const from = byId.get(edge.a)
      const to = byId.get(edge.b)
      return from && to ? { ...edge, from, to } : null
    })
    .filter((e): e is SkillEdge & { from: ConstellationNode; to: ConstellationNode } => e !== null)

  return { ...VIEW, nodes, edges, departments }
}

// ─────────────────────────────────────────────────────────── interaction ──

/**
 * How close the cursor must get, in view units, before a node leans toward it.
 * Roughly the radius of one department cluster on the current 1180×700
 * canvas — near enough that the pull reads as local, not as the whole canvas
 * swaying. MAGNET_MAX_PULL itself is defined above, next to the layout code
 * that has to build its safety margin around it.
 */
export const MAGNET_RADIUS = 140

export interface Vec2 {
  dx: number
  dy: number
}

const NO_PULL: Vec2 = { dx: 0, dy: 0 }

/**
 * How far one node should drift toward the cursor. Pure, so the guarantee that
 * displacement stays inside the safe bound is a test rather than a claim.
 *
 * Falloff is linear from full strength at the node to nothing at the radius,
 * which keeps the effect legible: the node under the cursor clearly leads, and
 * its neighbours trail off rather than all moving together.
 */
export function magnetOffset(
  node: { x: number; y: number },
  pointerX: number,
  pointerY: number,
  strength = 1,
  radius = MAGNET_RADIUS,
  maxPull = MAGNET_MAX_PULL,
): Vec2 {
  if (!Number.isFinite(pointerX) || !Number.isFinite(pointerY)) return NO_PULL
  if (strength <= 0) return NO_PULL

  const dx = pointerX - node.x
  const dy = pointerY - node.y
  const distance = Math.hypot(dx, dy)
  if (distance >= radius || distance < 0.0001) return NO_PULL

  const falloff = 1 - distance / radius
  // Never overshoot the cursor itself when it is almost on top of the node.
  const pull = Math.min(maxPull * falloff * strength, distance)
  return { dx: (dx / distance) * pull, dy: (dy / distance) * pull }
}

/** Ids of everyone one edge away from a node. */
export function neighbourIds(
  edges: { a: string; b: string }[],
  nodeId: string,
): Set<string> {
  const ids = new Set<string>()
  for (const edge of edges) {
    if (edge.a === nodeId) ids.add(edge.b)
    else if (edge.b === nodeId) ids.add(edge.a)
  }
  return ids
}

export function edgeTouches(edge: { a: string; b: string }, nodeId: string): boolean {
  return edge.a === nodeId || edge.b === nodeId
}

/**
 * What the hover state does to one node's opacity.
 *
 * Dimming is the point of the interaction: with a hundred-plus people and every shared
 * skill drawn, the picture is dense enough that highlighting alone does not
 * separate a person's connections from the rest of the field.
 */
export function nodeEmphasis(
  nodeId: string,
  hoveredId: string | null,
  neighbours: Set<string> | null,
): { opacity: number; related: boolean } {
  if (!hoveredId) return { opacity: 1, related: false }
  const related = nodeId === hoveredId || Boolean(neighbours?.has(nodeId))
  return { opacity: related ? 1 : DIMMED_OPACITY, related }
}

/** Base opacity for an edge, and what hovering does to it. */
export function edgeEmphasis(
  edge: { a: string; b: string },
  strength: number,
  hoveredId: string | null,
): number {
  const base = 0.06 + strength * 0.12
  if (!hoveredId) return base
  return edgeTouches(edge, hoveredId) ? 0.55 : base * DIMMED_OPACITY
}

export const DIMMED_OPACITY = 0.3

// ─────────────────────────────────────────────────────────── resting state ──

/**
 * A stable pseudo-random value in [0, 1) for a given string.
 *
 * Used for anything in the resting state that should look randomised — the
 * twinkle phase of a node, which way an edge bows — without ever actually
 * calling Math.random(). The layout promises the same data always produces
 * the same picture; a per-render random phase would break that promise the
 * first time someone screenshots the "same" dashboard twice.
 */
export function hashUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // >>> 0 forces an unsigned 32-bit value before normalising to [0, 1).
  return (h >>> 0) / 4294967296
}

/** Idle twinkle timing for one node — slow, small, and out of phase with its neighbours. */
export interface TwinklePlan {
  /** Seconds for one full breathe-in-and-out cycle. */
  period: number
  /** Negative start offset, in seconds, so nodes don't breathe in unison. */
  delay: number
}

const TWINKLE_MIN_PERIOD = 3.2
const TWINKLE_PERIOD_RANGE = 2.6

export function twinklePlan(nodeId: string): TwinklePlan {
  const period = TWINKLE_MIN_PERIOD + hashUnit(nodeId) * TWINKLE_PERIOD_RANGE
  const delay = -hashUnit(`${nodeId}:phase`) * period
  return { period, delay }
}

/**
 * How far a connecting line bows away from straight, and to which side.
 *
 * The sign comes from the edge's own id pair so the same two people always
 * curve the same way between reloads; the magnitude is a small, capped
 * fraction of the edge's length so a long cross-canvas line doesn't arc more
 * than a short local one.
 */
export function edgeCurveOffset(
  from: { x: number; y: number },
  to: { x: number; y: number },
  edgeId: string,
): { cx: number; cy: number } {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const side = hashUnit(edgeId) < 0.5 ? -1 : 1
  const bow = Math.min(16, length * 0.09) * side
  // Perpendicular unit vector, scaled by the bow amount.
  const nx = -dy / length
  const ny = dx / length
  return { cx: mx + nx * bow, cy: my + ny * bow }
}

/** One point in the decorative starfield behind the real nodes. */
export interface StarfieldPoint {
  x: number
  y: number
  r: number
  opacity: number
}

/**
 * A sprinkle of faint, static background dots — pure atmosphere, not data.
 *
 * Seeded from an index rather than the employee list, so the starfield does
 * not shift when someone's skill data changes; it is the sky the real nodes
 * hang in, not a rendering of anything.
 */
export function generateStarfield(
  width: number,
  height: number,
  count = 70,
): StarfieldPoint[] {
  const stars: StarfieldPoint[] = []
  for (let i = 0; i < count; i++) {
    const seed = `star:${i}`
    stars.push({
      x: hashUnit(`${seed}:x`) * width,
      y: hashUnit(`${seed}:y`) * height,
      r: 0.5 + hashUnit(`${seed}:r`) * 0.9,
      opacity: 0.06 + hashUnit(`${seed}:o`) * 0.14,
    })
  }
  return stars
}
