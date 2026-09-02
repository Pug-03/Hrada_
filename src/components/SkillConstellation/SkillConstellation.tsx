import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Employee } from '@/data/types'
import {
  edgeCurveOffset,
  edgeEmphasis,
  edgeTouches,
  generateStarfield,
  layoutConstellation,
  magnetOffset,
  neighbourIds,
  nodeEmphasis,
  twinklePlan,
  type ConstellationLayout,
  type ConstellationNode,
  type Vec2,
} from '@/lib/constellation'
import { colors, departmentHalo, departmentSwatch, motion as motionTokens } from '@/lib/theme'
import { useName, useT } from '@/lib/i18n'
import { NumericText } from '@/components/ui/NumericText'

/**
 * §4 — the signature element. HRADA calls itself a Skill Graph, so the graph
 * is drawn rather than described: one node per person, a line wherever two
 * people share a skill at 3.0 or better, thickness from how much they share.
 *
 * This is the one place in the product that spends any visual boldness (§3.3),
 * and the one orchestrated entrance §5 allows — clusters fade in department by
 * department on first paint and never again.
 *
 * Everything below the entrance is a response to the pointer, which is the
 * other half of what §5 permits:
 *   — hovering lifts a node, glows it, brightens what it connects to, and
 *     drops everything unrelated to 30% so one person's reach is readable;
 *   — nodes within MAGNET_RADIUS lean toward the cursor, which makes the field
 *     feel like a material rather than a picture;
 *   — a light travels each connected edge while a node is held, showing which
 *     way the relationship is being read;
 *   — clicking rings the node before the layoutId hand-off to the profile.
 *
 * Under prefers-reduced-motion every one of those is off. The hover highlight
 * and the dimming stay, because they carry meaning rather than delight, and
 * they are applied without animation.
 */

/** One pointer position shared by every node and edge, in view units. */
interface Pointer {
  x: MotionValue<number>
  y: MotionValue<number>
  strength: MotionValue<number>
}

const POINTER_SPRING = { stiffness: 260, damping: 30, mass: 0.4 }
const STRENGTH_SPRING = { stiffness: 180, damping: 26 }
const HOVER_SPRING = { type: 'spring' as const, stiffness: 340, damping: 18 }
const PULSE_PERIOD_MS = 1500
const RIPPLE_MS = 260
const TILT_SPRING = { stiffness: 120, damping: 22, mass: 0.6 }
/**
 * Maximum canvas rotation, in degrees. Small on purpose: enough that the field
 * reads as a surface with depth rather than a flat image, not enough to skew a
 * circle into an ellipse or soften an edge.
 */
const TILT_MAX_DEG = 1.6
/** A stable zero vector — reduced motion returns this rather than allocating a fresh object every frame. */
const NO_DRIFT: Vec2 = { dx: 0, dy: 0 }
/**
 * The idle glow's resting opacity and how far the twinkle moves it in either
 * direction. Small on purpose — requirement is that it "feels alive," not
 * that it draws the eye away from what hovering does.
 */
const IDLE_GLOW_BASE = 0.3
const IDLE_GLOW_AMPLITUDE = 0.09
/** ~12 updates a second for the twinkle — plenty for a multi-second breathe. */
const TWINKLE_STEP_MS = 80

export function SkillConstellation({
  employees,
  onSelect,
}: {
  employees: Employee[]
  onSelect?: (employee: Employee) => void
}) {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const t = useT()
  const name = useName()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hovered, setHovered] = useState<ConstellationNode | null>(null)
  const [ripple, setRipple] = useState<ConstellationNode | null>(null)
  /**
   * Tilt is dropped the instant a node is clicked and stays off until the
   * hand-off is done. A rotate transform on an ancestor of the layoutId circle
   * is what breaks Framer's layout projection, and the failure mode is the
   * node arriving at the profile from the wrong place — so the canvas is made
   * flat before the transition is allowed to begin.
   */
  const [tilting, setTilting] = useState(true)

  const layout = useMemo(() => layoutConstellation(employees), [employees])
  const stars = useMemo(() => generateStarfield(layout.width, layout.height), [layout.width, layout.height])
  const maxShared = Math.max(1, ...layout.edges.map((e) => e.sharedSkills.length))
  const neighbours = useMemo(
    () => (hovered ? neighbourIds(layout.edges, hovered.id) : null),
    [hovered, layout.edges],
  )

  // A single springed pointer feeds every node and edge. Springing here rather
  // than per node keeps the count at two regardless of how many people are on
  // screen, and guarantees the whole field moves as one coherent surface.
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rawStrength = useMotionValue(0)
  const pointer: Pointer = {
    x: useSpring(rawX, POINTER_SPRING),
    y: useSpring(rawY, POINTER_SPRING),
    // Strength decays to zero on leave, so nodes ease home instead of being
    // dragged along whatever path the cursor took on its way out.
    strength: useSpring(rawStrength, STRENGTH_SPRING),
  }

  // Parallax, driven by the same pointer but springed separately so the canvas
  // settles a little behind the nodes rather than with them.
  const rawTiltX = useMotionValue(0)
  const rawTiltY = useMotionValue(0)
  const tiltX = useSpring(rawTiltX, TILT_SPRING)
  const tiltY = useSpring(rawTiltY, TILT_SPRING)

  /**
   * One shared clock for every animated-but-not-interactive element, rather
   * than each one running its own. The idle twinkle used to be 114
   * independent Framer animation controllers, each doing its own easing-curve
   * evaluation and DOM write, forever, whether or not anyone was looking at
   * the page. One clock, quantised to ~12 updates a second for the twinkle
   * specifically — a 3–6 second breathing cycle does not need 60fps
   * precision — cuts that to 114 cheap sine reads off one shared value.
   * EdgePulse (the travelling hover light) keeps the unthrottled clock, since
   * that one does benefit from smooth motion along the curve.
   */
  const clock = useTime()
  const twinkleClock = useTransform(clock, (t) => Math.round(t / TWINKLE_STEP_MS) * TWINKLE_STEP_MS)

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (reduced) return
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      const fractionX = (event.clientX - rect.left) / rect.width
      const fractionY = (event.clientY - rect.top) / rect.height
      rawX.set(fractionX * layout.width)
      rawY.set(fractionY * layout.height)
      rawStrength.set(1)
      // Pointer right of centre lifts the right edge toward the viewer, the
      // way a physical surface would tip under a finger.
      rawTiltY.set((fractionX - 0.5) * 2 * TILT_MAX_DEG)
      rawTiltX.set(-(fractionY - 0.5) * 2 * TILT_MAX_DEG)
    },
    [reduced, rawX, rawY, rawStrength, rawTiltX, rawTiltY, layout.width, layout.height],
  )

  const onPointerLeave = useCallback(() => {
    rawStrength.set(0)
    rawTiltX.set(0)
    rawTiltY.set(0)
    setHovered(null)
  }, [rawStrength, rawTiltX, rawTiltY])

  const open = useCallback(
    (node: ConstellationNode) => {
      if (onSelect) onSelect(node.employee)
      else navigate(`/employees/${node.employee.id}`)
    },
    [onSelect, navigate],
  )

  // The ring plays first, then the node hands off to the profile. Under
  // reduced motion there is no ring and no wait.
  const activate = useCallback(
    (node: ConstellationNode) => {
      if (reduced) {
        open(node)
        return
      }
      // Flatten first. Swapping the style to a literal 0 is not an animation,
      // so the canvas is already square by the time the ring starts playing.
      setTilting(false)
      rawTiltX.set(0)
      rawTiltY.set(0)
      setRipple(node)
      window.setTimeout(() => {
        setRipple(null)
        open(node)
      }, RIPPLE_MS)
    },
    [reduced, open, rawTiltX, rawTiltY],
  )

  const tiltActive = tilting && !reduced

  return (
    <div className="relative">
      {/*
        The tilt lives on a wrapper rather than the svg itself so the
        tooltip and the legend outside it stay square and crisp.
      */}
      <motion.div
        data-tilt={tiltActive ? 'on' : 'off'}
        style={
          tiltActive
            ? { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1400 }
            : { rotateX: 0, rotateY: 0 }
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full"
          role="img"
          aria-label={t('constellation.label', { count: employees.length })}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <defs>
            {/*
              Bright core fading to the edge, rather than the reverse — a
              flat-filled circle reads as a network diagram's node; a hot
              centre that falls off reads as a point of light.
            */}
            <radialGradient id="node-core" cx="42%" cy="38%" r="65%">
              <stop offset="0%" stopColor={colors.text} stopOpacity={0.95} />
              <stop offset="35%" stopColor={colors.sky} stopOpacity={0.95} />
              <stop offset="100%" stopColor={colors.sky} stopOpacity={0.55} />
            </radialGradient>
            {/* Always-on ambient glow — soft at rest, in §4's warn colour for the overload ring. */}
            <filter id="node-glow-idle" x="-160%" y="-160%" width="420%" height="420%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.4" floodColor={colors.sky} floodOpacity="0.9" />
            </filter>
            {/* Hover glow. Sky only — the palette stays closed (§3.1). */}
            <filter id="node-glow" x="-160%" y="-160%" width="420%" height="420%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5"
                floodColor={colors.sky}
                floodOpacity="0.85"
              />
            </filter>
          </defs>

          {/*
            Decorative starfield — atmosphere, not data. Smaller, dimmer, no
            glow, no edges, and rendered as plain circles rather than motion
            components: nothing here ever moves or responds to the pointer.
            Sky, not haze — decoration stays inside the one hue this canvas
            already uses rather than introducing a second family for it.
          */}
          <g aria-hidden data-constellation-starfield fill={colors.sky}>
            {stars.map((star, i) => (
              <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.opacity} />
            ))}
          </g>

          {/* Edges first, so nodes always sit above their connections. */}
          <g>
            {layout.edges.map((edge) => (
              <Edge
                key={`${edge.a}-${edge.b}`}
                edge={edge}
                strength={edge.sharedSkills.length / maxShared}
                hoveredId={hovered?.id ?? null}
                pointer={pointer}
                reduced={Boolean(reduced)}
              />
            ))}
          </g>

          {/* Energy travelling outward along whatever the held node touches. */}
          {hovered && !reduced ? (
            <g aria-hidden data-constellation-pulses>
              {layout.edges
                .filter((edge) => edgeTouches(edge, hovered.id))
                .map((edge) => (
                  <EdgePulse
                    key={`pulse-${edge.a}-${edge.b}`}
                    from={edge.from.id === hovered.id ? edge.from : edge.to}
                    to={edge.from.id === hovered.id ? edge.to : edge.from}
                    pointer={pointer}
                    clock={clock}
                  />
                ))}
            </g>
          ) : null}

          {layout.nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              layout={layout}
              hoveredId={hovered?.id ?? null}
              neighbours={neighbours}
              rippling={ripple?.id === node.id}
              pointer={pointer}
              reduced={Boolean(reduced)}
              displayName={name(node.employee)}
              twinkleClock={twinkleClock}
              onHover={setHovered}
              onActivate={activate}
            />
          ))}
        </svg>
      </motion.div>

      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-panel-raised px-2.5 py-1.5 text-micro shadow-lg shadow-black/50"
          style={{
            left: `${(hovered.x / layout.width) * 100}%`,
            top: `${(hovered.y / layout.height) * 100}%`,
            marginTop: -10,
          }}
        >
          <p className="text-small">{name(hovered.employee)}</p>
          <p className="text-haze">{hovered.employee.title}</p>
          {hovered.overloaded ? (
            <p className="mt-0.5 text-warn">
              Workload <span className="num">{hovered.employee.workload}%</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-micro text-haze">
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
          <NumericText>{t('constellation.legend', { level: '3.0', threshold: '85%' })}</NumericText>
        </span>
      </div>
    </div>
  )
}

/** Drift for one point, derived from the shared pointer. */
/**
 * Drift for one point, derived from the shared pointer.
 *
 * magnetOffset does a hypot, a normalise and a couple of conditionals — cheap
 * once, but this used to call it twice per point per frame (once to read
 * .dx, once to read .dy, throwing away the other half each time), across
 * every node and both endpoints of every edge. At 114 nodes / 830 edges that
 * was 3,548 calls a frame instead of 114. One combined useTransform computes
 * the vector once; dx and dy are then cheap reads off that single result.
 */
function useDrift(point: { x: number; y: number }, pointer: Pointer, reduced: boolean) {
  const offset = useTransform<number, Vec2>(
    [pointer.x, pointer.y, pointer.strength],
    ([px, py, s]) => (reduced ? NO_DRIFT : magnetOffset(point, px, py, s)),
  )
  const dx = useTransform(offset, (o) => o.dx)
  const dy = useTransform(offset, (o) => o.dy)
  return { dx, dy }
}

function Edge({
  edge,
  strength,
  hoveredId,
  pointer,
  reduced,
}: {
  edge: ConstellationLayout['edges'][number]
  strength: number
  hoveredId: string | null
  pointer: Pointer
  reduced: boolean
}) {
  const from = useDrift(edge.from, pointer, reduced)
  const to = useDrift(edge.to, pointer, reduced)
  const edgeId = `${edge.a}-${edge.b}`

  // Endpoints track the nodes they belong to, so a drifting node never leaves
  // its lines behind. The curve's control point is recomputed from those same
  // live endpoints, so the bow follows the drift too rather than staying
  // pinned to the rest position.
  const d = useTransform<number, string>(
    [from.dx, from.dy, to.dx, to.dy],
    ([fdx, fdy, tdx, tdy]) => {
      const start = { x: edge.from.x + fdx, y: edge.from.y + fdy }
      const end = { x: edge.to.x + tdx, y: edge.to.y + tdy }
      const { cx, cy } = edgeCurveOffset(start, end, edgeId)
      return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`
    },
  )

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={colors.sky}
      strokeWidth={0.4 + strength * 1.7}
      initial={reduced ? { opacity: 0.14 } : { opacity: 0 }}
      animate={{ opacity: edgeEmphasis(edge, strength, hoveredId) }}
      transition={{ duration: reduced ? 0.12 : 0.28, delay: reduced ? 0 : 0.35 }}
    />
  )
}

/**
 * A light running from the held node toward one neighbour. Driven by the
 * document clock rather than a per-edge animation, so every pulse in the
 * field is in phase and mounting one costs nothing.
 */
function EdgePulse({
  from,
  to,
  pointer,
  clock,
}: {
  from: ConstellationNode
  to: ConstellationNode
  pointer: Pointer
  clock: MotionValue<number>
}) {
  // Shares the one clock every other ambient element uses, rather than
  // registering its own useTime() — this used to be one per hovered edge.
  const progress = useTransform(clock, (t) => ((t % PULSE_PERIOD_MS) / PULSE_PERIOD_MS))
  const fromDrift = useDrift(from, pointer, false)
  const toDrift = useDrift(to, pointer, false)
  const edgeId = `${from.id}-${to.id}`

  // Travels the same quadratic bezier the edge itself is drawn as (§5), not a
  // straight-line shortcut across it.
  const pointX = useTransform<number, number>(
    [progress, fromDrift.dx, fromDrift.dy, toDrift.dx, toDrift.dy],
    ([p, fdx, fdy, tdx, tdy]) => {
      const start = { x: from.x + fdx, y: from.y + fdy }
      const end = { x: to.x + tdx, y: to.y + tdy }
      const { cx } = edgeCurveOffset(start, end, edgeId)
      const inv = 1 - p
      return inv * inv * start.x + 2 * inv * p * cx + p * p * end.x
    },
  )
  const pointY = useTransform<number, number>(
    [progress, fromDrift.dx, fromDrift.dy, toDrift.dx, toDrift.dy],
    ([p, fdx, fdy, tdx, tdy]) => {
      const start = { x: from.x + fdx, y: from.y + fdy }
      const end = { x: to.x + tdx, y: to.y + tdy }
      const { cy } = edgeCurveOffset(start, end, edgeId)
      const inv = 1 - p
      return inv * inv * start.y + 2 * inv * p * cy + p * p * end.y
    },
  )
  // Fades in as it leaves and out as it arrives, so nothing pops at either end.
  const opacity = useTransform(progress, [0, 0.15, 0.85, 1], [0, 0.9, 0.9, 0])

  return <motion.circle cx={pointX} cy={pointY} r={1.8} fill={colors.sky} style={{ opacity }} />
}

function Node({
  node,
  layout,
  hoveredId,
  neighbours,
  rippling,
  pointer,
  reduced,
  displayName,
  twinkleClock,
  onHover,
  onActivate,
}: {
  node: ConstellationNode
  layout: ConstellationLayout
  hoveredId: string | null
  neighbours: Set<string> | null
  rippling: boolean
  pointer: Pointer
  reduced: boolean
  displayName: string
  twinkleClock: MotionValue<number>
  onHover: (node: ConstellationNode | null) => void
  onActivate: (node: ConstellationNode) => void
}) {
  const { dx, dy } = useDrift(node, pointer, reduced)
  const active = hoveredId === node.id
  const { opacity } = nodeEmphasis(node.id, hoveredId, neighbours)
  const delay = reduced
    ? 0
    : layout.departments.indexOf(node.department) * motionTokens.constellationStagger
  const twinkle = useMemo(() => twinklePlan(node.id), [node.id])
  // A cheap sine read off the one shared, throttled clock — replaces what
  // used to be this node's own independent Framer animation controller
  // running a keyframe-array easing loop forever, whether or not the tab was
  // even visible.
  const idleGlowOpacity = useTransform(twinkleClock, (t) =>
    reduced ? IDLE_GLOW_BASE : twinkleOpacity(t, twinkle),
  )

  return (
    <motion.g
      initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
      animate={{ opacity, scale: active && !reduced ? 1.2 : 1 }}
      transition={{
        opacity: { delay, duration: reduced ? 0.12 : 0.5, ease: [0.16, 1, 0.3, 1] },
        scale: active && !reduced ? HOVER_SPRING : { delay, duration: reduced ? 0.12 : 0.5 },
      }}
      style={{
        x: dx,
        y: dy,
        transformOrigin: `${node.x}px ${node.y}px`,
        cursor: 'pointer',
      }}
      data-node-id={node.id}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onActivate(node)}
      tabIndex={0}
      role="button"
      aria-label={`${displayName} — ${node.employee.title}`}
      onFocus={() => onHover(node)}
      onBlur={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onActivate(node)
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

      {/* Click ring, played before the hand-off to the profile. */}
      {rippling ? (
        <motion.circle
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill="none"
          stroke={colors.sky}
          strokeWidth={1.5}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: RIPPLE_MS / 1000, ease: 'easeOut' }}
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        />
      ) : null}

      <circle
        cx={node.x}
        cy={node.y}
        r={node.r + (active ? 5 : 3)}
        fill={departmentHalo(node.department)}
      />

      {/*
        Permanent soft glow — every node gets one, not just the hovered one.
        It is what turns a filled circle into a point of light rather than a
        network-diagram node. The twinkle lives entirely on this circle's own
        opacity, on its own loop, so it never fights the hover glow below or
        the emphasis opacity on the group: three independent signals stacked
        rather than one opacity value doing three jobs.
      */}
      <motion.circle
        data-idle-glow={node.id}
        cx={node.x}
        cy={node.y}
        r={node.r * 0.85}
        fill={colors.sky}
        filter="url(#node-glow-idle)"
        initial={false}
        animate={
          reduced
            ? { opacity: IDLE_GLOW_BASE }
            : {
                opacity: [
                  IDLE_GLOW_BASE - IDLE_GLOW_AMPLITUDE,
                  IDLE_GLOW_BASE + IDLE_GLOW_AMPLITUDE,
                  IDLE_GLOW_BASE - IDLE_GLOW_AMPLITUDE,
                ],
              }
        }
        transition={
          reduced
            ? { duration: 0 }
            : {
                duration: twinkle.period,
                delay: twinkle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      />

      {/*
        The hover glow sits on its own circle rather than on the core. The
        core carries the layoutId that flies into the profile, and an SVG
        filter changes the box that projection measures.
      */}
      {active && !reduced ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.r * 0.9}
          fill={colors.sky}
          opacity={0.85}
          filter="url(#node-glow)"
        />
      ) : null}

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
}
