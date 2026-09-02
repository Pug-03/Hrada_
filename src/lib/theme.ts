/**
 * Design tokens, mirrored from the @theme block in src/index.css so TypeScript
 * (charts, SVG, canvas) can reach the same values Tailwind uses.
 *
 * The palette is closed — §3.1 lists these ten colours and nothing else ships.
 * `sky` carries meaning rather than style: it marks a number a scoring function
 * produced. Using it to make something look nice breaks the association the
 * whole interface depends on, so growth and positive movement use it too
 * (never green), and decoration uses none of it.
 */
export const colors = {
  ink: '#070B12',
  panel: '#0F1826',
  panelRaised: '#141F30',
  line: '#1C2C42',
  signal: '#2563EB',
  sky: '#38BDF8',
  haze: '#8AA2C0',
  text: '#E6EEF9',
  warn: '#F59E0B',
  critical: '#F87171',
} as const

/** §3.2 — the only type sizes in the system. */
export const typeScale = {
  display: 40,
  title: 28,
  section: 20,
  body: 15,
  small: 13,
  micro: 11,
} as const

/**
 * §5 — motion is either a response to something the user did, or the single
 * orchestrated Dashboard entrance. These are the only durations in play, so a
 * panel and a toast never disagree about what "fast" means.
 */
export const motion = {
  route: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
  hover: { duration: 0.15 },
  panel: { type: 'spring' as const, stiffness: 260, damping: 30 },
  reorder: { type: 'spring' as const, stiffness: 320, damping: 34 },
  counter: 0.9,
  /** Per-department stagger for the constellation's first paint. */
  constellationStagger: 0.12,
} as const

/**
 * A palette colour at a given alpha. The only sanctioned way to soften a
 * token: the hue is never redefined, only its opacity, so nothing can drift
 * outside §3.1 by degrees.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}


interface Hsl {
  h: number
  s: number
  l: number
}

function hexToHsl(hex: string): Hsl {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}

function hslString({ h, s, l }: Hsl, alpha: number): string {
  return `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${alpha.toFixed(3)})`
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const SKY_HSL = hexToHsl(colors.sky)
const SIGNAL_HSL = hexToHsl(colors.signal)

/**
 * Order the constellation clusters render in — Marketing sits at the `sky`
 * end of the blend, Sales at the `signal` end, the other three spaced evenly
 * between. Kept in one place so the legend and the layout agree on it.
 */
export const DEPARTMENT_ORDER = ['Marketing', 'Data', 'Product', 'Operations', 'Sales']

/**
 * Five department identities, and still zero new hues.
 *
 * Each one is a point on the straight line between the `sky` and `signal`
 * tokens in HSL space — never a hue outside that segment. Interpolating
 * lightness and saturation alongside hue (rather than only varying opacity,
 * as an earlier version of this did) is what makes five points actually
 * distinguishable at a glance instead of five shades of the same translucent
 * blue.
 */
function departmentHsl(department: string): Hsl {
  const index = DEPARTMENT_ORDER.indexOf(department)
  const steps = DEPARTMENT_ORDER.length - 1
  const t = index === -1 ? 0.5 : index / steps
  return {
    h: lerp(SKY_HSL.h, SIGNAL_HSL.h, t),
    s: lerp(SKY_HSL.s, SIGNAL_HSL.s, t),
    l: lerp(SKY_HSL.l, SIGNAL_HSL.l, t),
  }
}

export function departmentColor(department: string, alpha = 1): string {
  return hslString(departmentHsl(department), alpha)
}

/** The ambient ring behind a node — present but soft at rest. */
export function departmentHalo(department: string): string {
  return departmentColor(department, 0.24)
}

/** Legend key and anything else that needs the identity to actually read. */
export function departmentSwatch(department: string): string {
  return departmentColor(department, 0.95)
}

/**
 * Talent badges, drawn from the palette rather than a new set of hues:
 * sky for evidenced depth, signal for reach across the org, haze for someone
 * still on the way up.
 */
export const talentColor = {
  'Core Expert': colors.sky,
  'Bridge Member': colors.signal,
  'Developing Talent': colors.haze,
} as const

/** Multi-series charts cycle the palette, never a new colour. */
export const seriesPalette = [colors.sky, colors.signal, colors.haze] as const
