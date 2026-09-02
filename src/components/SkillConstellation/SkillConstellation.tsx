import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Employee } from '@/data/types'
import { layoutConstellation, type ConstellationNode } from '@/lib/constellation'
import { colors, departmentHalo, departmentSwatch, motion as motionTokens } from '@/lib/theme'

/**
 * §4 — the signature element. HRADA calls itself a Skill Graph, so the graph
 * is drawn rather than described: one node per person, a line wherever two
 * people share a skill at 3.0 or better, thickness from how much they share.
 *
 * This is the one place in the product that spends any visual boldness (§3.3),
 * and the one orchestrated entrance §5 allows — clusters fade in department by
 * department on first paint and never again.
 */
export function SkillConstellation({
  employees,
  onSelect,
}: {
  employees: Employee[]
  onSelect?: (employee: Employee) => void
}) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const [hovered, setHovered] = useState<ConstellationNode | null>(null)

  const layout = useMemo(() => layoutConstellation(employees), [employees])
  const maxShared = Math.max(1, ...layout.edges.map((e) => e.sharedSkills.length))

  const open = (node: ConstellationNode) => {
    if (onSelect) onSelect(node.employee)
    else navigate(`/employees/${node.employee.id}`)
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full"
        role="img"
        aria-label={`Skill Constellation ของพนักงาน ${employees.length} คน`}
      >
        <defs>
          <radialGradient id="node-core" cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.sky} stopOpacity={0.6} />
            <stop offset="100%" stopColor={colors.sky} />
          </radialGradient>
        </defs>

        {/* Edges first, so nodes always sit above their connections. */}
        <g>
          {layout.edges.map((edge) => {
            const strength = edge.sharedSkills.length / maxShared
            const touched =
              hovered && (hovered.id === edge.from.id || hovered.id === edge.to.id)
            return (
              <motion.line
                key={`${edge.a}-${edge.b}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={colors.sky}
                strokeWidth={0.4 + strength * 1.7}
                initial={reduced ? { opacity: 0.14 } : { opacity: 0 }}
                animate={{ opacity: touched ? 0.55 : 0.06 + strength * 0.12 }}
                transition={{ duration: reduced ? 0.12 : 0.5, delay: reduced ? 0 : 0.35 }}
              />
            )
          })}
        </g>

        {layout.nodes.map((node) => {
          const delay = reduced
            ? 0
            : layout.departments.indexOf(node.department) * motionTokens.constellationStagger
          const active = hovered?.id === node.id
          return (
            <motion.g
              key={node.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay,
                duration: reduced ? 0.12 : 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ transformOrigin: `${node.x}px ${node.y}px`, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(node)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => open(node)}
              tabIndex={0}
              role="button"
              aria-label={`${node.employee.name} — ${node.employee.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') open(node)
              }}
            >
              {/* Ambient pulse for anyone over 85% committed (§4). */}
              {node.overloaded ? (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 6}
                  fill="none"
                  stroke={colors.warn}
                  strokeWidth={1}
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={reduced ? { opacity: 0.35 } : { opacity: [0.45, 0.08, 0.45], scale: [1, 1.18, 1] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
              ) : null}

              <circle
                cx={node.x}
                cy={node.y}
                r={node.r + (active ? 5 : 3)}
                fill={departmentHalo(node.department)}
                opacity={active ? 2 : 1}
              />
              <motion.circle
                layoutId={`employee-node-${node.employee.id}`}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="url(#node-core)"
                opacity={0.45 + node.intensity * 0.55}
              />
            </motion.g>
          )
        })}
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-panel-raised px-2.5 py-1.5 text-[11px] shadow-lg shadow-black/50"
          style={{
            left: `${(hovered.x / layout.width) * 100}%`,
            top: `${(hovered.y / layout.height) * 100}%`,
            marginTop: -10,
          }}
        >
          <p className="text-[13px]">{hovered.employee.name}</p>
          <p className="text-haze">{hovered.employee.title}</p>
          {hovered.overloaded ? (
            <p className="mt-0.5 text-warn">
              Workload <span className="num">{hovered.employee.workload}%</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-[11px] text-haze">
        {layout.departments.map((department) => (
          <span key={department} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: departmentSwatch(department) }}
            />
            {department}
          </span>
        ))}
        <span className="ml-auto">
          เส้นเชื่อม = มี skill ร่วมกันตั้งแต่ระดับ <span className="num">3.0</span> · ขนาดจุด = ระดับ skill รวม ·
          วงสีส้ม = Workload เกิน <span className="num">85%</span>
        </span>
      </div>
    </div>
  )
}
