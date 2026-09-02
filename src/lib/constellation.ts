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

export const VIEW = { width: 900, height: 520 }

/**
 * Hand-placed cluster centres. A real force simulation drifts between reloads
 * and reads as noise; fixed anchors with local relaxation keep the composition
 * stable while the people inside a department still settle naturally.
 */
const CLUSTER_CENTRES: Record<Department, { x: number; y: number }> = {
  Marketing: { x: 235, y: 152 },
  Data: { x: 648, y: 138 },
  Product: { x: 722, y: 348 },
  Operations: { x: 452, y: 428 },
  Sales: { x: 172, y: 356 },
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * §4 — a light approximated layout. Members start on a ring around their
 * department centre, then a fixed number of relaxation passes push apart any
 * pair that would overlap while a weak spring holds each node near its
 * cluster. Deterministic: the same data always produces the same picture.
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
    const ringRadius = 30 + members.length * 9
    members.forEach((employee, i) => {
      const angle = i * GOLDEN_ANGLE + departments.indexOf(department)
      const mass = totalSkillLevel(employee)
      const intensity = (mass - minMass) / massRange
      nodes.push({
        id: employee.id,
        employee,
        department,
        x: centre.x + Math.cos(angle) * ringRadius,
        y: centre.y + Math.sin(angle) * ringRadius,
        r: 7 + intensity * 9,
        intensity,
        overloaded: employee.workload > 85,
      })
    })
  }

  // Relaxation: separate overlapping nodes, keep everyone near their cluster.
  const PASSES = 90
  for (let pass = 0; pass < PASSES; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 0.001
        const minDistance = a.r + b.r + 22
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
      node.x += (centre.x - node.x) * 0.02
      node.y += (centre.y - node.y) * 0.02
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
 * The viewBox is 900×520, so this is roughly the radius of one department
 * cluster — near enough that the pull reads as local, not as the whole canvas
 * swaying.
 */
export const MAGNET_RADIUS = 140

/**
 * Ceiling on how far a node may travel. Nodes are separated by at least
 * `a.r + b.r + 22` during layout, so a displacement of 9 cannot make two of
 * them touch even when they lean toward each other from opposite sides, and it
 * is small enough that a person never appears to leave their department.
 */
export const MAGNET_MAX_PULL = 9

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
 * Dimming is the point of the interaction: with 14 people and every shared
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
