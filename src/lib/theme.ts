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
 * Departments are encoded by tint of a single token, not by inventing hues.
 *
 * Five distinct brand colours would mean five values that are not in §3.1, and
 * a categorical rainbow competes with the one thing `sky` is supposed to mean.
 * The clusters are already separated in space and labelled in the legend, so
 * opacity steps of `sky` carry the grouping without spending new colour.
 */
export const departmentTint: Record<string, number> = {
  Marketing: 1,
  Data: 0.82,
  Product: 0.64,
  Operations: 0.46,
  Sales: 0.3,
}

/** `sky` at a given alpha. The hue is never redefined, only its opacity. */
function skyAlpha(alpha: number): string {
  const hex = colors.sky.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}

export function departmentHalo(department: string): string {
  return skyAlpha(0.08 + (departmentTint[department] ?? 0.5) * 0.16)
}

export function departmentSwatch(department: string): string {
  return skyAlpha(0.25 + (departmentTint[department] ?? 0.5) * 0.75)
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
