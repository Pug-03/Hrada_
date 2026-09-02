import { describe, expect, it } from 'vitest'

import {
  colors,
  DEPARTMENT_ORDER,
  departmentColor,
  departmentHalo,
  departmentSwatch,
} from './theme'

/**
 * §3.1 — five department identities, zero new hues. These exist because the
 * palette-closed check in design-rules.test.ts only catches hex literals
 * outside theme.ts; it says nothing about whether an *hsl* value invented
 * here quietly drifts outside the sky/signal family. This is that check.
 */
function parseHsl(value: string): { h: number; s: number; l: number; a: number } {
  const match = value.match(
    /^hsla\((-?[\d.]+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)$/,
  )
  if (!match) throw new Error(`not an hsla() string: ${value}`)
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]), a: Number(match[4]) }
}

function hexToHslForTest(hex: string) {
  const raw = hex.replace('#', '')
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (d !== 0) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  return { h: h * 60, s: s * 100, l: l * 100 }
}

const SKY = hexToHslForTest(colors.sky)
const SIGNAL = hexToHslForTest(colors.signal)

describe('departmentColor', () => {
  it('gives every department a distinct colour', () => {
    const values = DEPARTMENT_ORDER.map((d) => departmentColor(d))
    expect(new Set(values).size).toBe(DEPARTMENT_ORDER.length)
  })

  it('never leaves the hue range between sky and signal', () => {
    const [lo, hi] = SKY.h < SIGNAL.h ? [SKY.h, SIGNAL.h] : [SIGNAL.h, SKY.h]
    for (const department of DEPARTMENT_ORDER) {
      const { h } = parseHsl(departmentColor(department))
      expect(h).toBeGreaterThanOrEqual(lo - 0.05)
      expect(h).toBeLessThanOrEqual(hi + 0.05)
    }
  })

  it('places the first and last department exactly on the two tokens', () => {
    const first = parseHsl(departmentColor(DEPARTMENT_ORDER[0]))
    const last = parseHsl(departmentColor(DEPARTMENT_ORDER[DEPARTMENT_ORDER.length - 1]))
    expect(first.h).toBeCloseTo(SKY.h, 0)
    expect(first.s).toBeCloseTo(SKY.s, 0)
    expect(first.l).toBeCloseTo(SKY.l, 0)
    expect(last.h).toBeCloseTo(SIGNAL.h, 0)
    expect(last.s).toBeCloseTo(SIGNAL.s, 0)
    expect(last.l).toBeCloseTo(SIGNAL.l, 0)
  })

  it('separates departments by more than a rounding error in lightness or saturation', () => {
    // The old opacity-only encoding failed exactly here: every "colour" had
    // the same hue, saturation and lightness, and differed only in alpha.
    for (let i = 0; i < DEPARTMENT_ORDER.length; i++) {
      for (let j = i + 1; j < DEPARTMENT_ORDER.length; j++) {
        const a = parseHsl(departmentColor(DEPARTMENT_ORDER[i]))
        const b = parseHsl(departmentColor(DEPARTMENT_ORDER[j]))
        const separation = Math.abs(a.h - b.h) + Math.abs(a.s - b.s) + Math.abs(a.l - b.l)
        expect(separation, `${DEPARTMENT_ORDER[i]} vs ${DEPARTMENT_ORDER[j]}`).toBeGreaterThan(1)
      }
    }
  })

  it('respects the requested alpha', () => {
    expect(parseHsl(departmentColor('Marketing', 0.3)).a).toBeCloseTo(0.3, 3)
  })
})

describe('departmentHalo vs departmentSwatch', () => {
  it('keeps the halo soft and the swatch solid enough to read as an identity', () => {
    for (const department of DEPARTMENT_ORDER) {
      expect(parseHsl(departmentHalo(department)).a).toBeLessThan(0.5)
      expect(parseHsl(departmentSwatch(department)).a).toBeGreaterThan(0.8)
    }
  })

  it('gives the halo and the swatch the same hue for a given department', () => {
    for (const department of DEPARTMENT_ORDER) {
      const halo = parseHsl(departmentHalo(department))
      const swatch = parseHsl(departmentSwatch(department))
      expect(halo.h).toBeCloseTo(swatch.h, 1)
    }
  })
})
