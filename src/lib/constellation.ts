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
