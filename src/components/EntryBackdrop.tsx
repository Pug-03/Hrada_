import { useMemo } from 'react'

import { colors } from '@/lib/theme'

const VIEW = { width: 1200, height: 760 }
const DOT_COUNT = 44
const LINK_DISTANCE = 168
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * A still field of points and links behind the entry screen.
 *
 * It borrows the constellation's vocabulary — dots of varying weight, thin
 * lines where two of them are close — so the Dashboard's centrepiece reads as
 * something the product was already hinting at rather than a surprise. It
 * stays deliberately below the threshold of notice: no animation, no gradient,
 * and an opacity low enough that it registers as texture on the panel rather
 * than as content competing with the role picker.
 *
 * §3.3 — boldness is spent in exactly one place, and this is not it.
 */
function field() {
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    // Phyllotaxis: even coverage with no clumping, and no randomness, so the
    // texture is identical on every visit.
    const angle = i * GOLDEN_ANGLE
    const radius = Math.sqrt(i / DOT_COUNT)
    return {
      id: i,
      x: VIEW.width / 2 + Math.cos(angle) * radius * (VIEW.width * 0.52),
      y: VIEW.height / 2 + Math.sin(angle) * radius * (VIEW.height * 0.54),
      r: 1 + (i % 5) * 0.28,
    }
  })

  const links: { id: string; x1: number; y1: number; x2: number; y2: number }[] = []
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const a = dots[i]
      const b = dots[j]
      if (Math.hypot(b.x - a.x, b.y - a.y) > LINK_DISTANCE) continue
      links.push({ id: `${i}-${j}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y })
    }
  }

  return { dots, links }
}

export function EntryBackdrop() {
  const { dots, links } = useMemo(() => field(), [])

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      data-entry-backdrop
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      style={{
        // Fades out toward the edges so the texture has no visible boundary.
        maskImage: 'radial-gradient(ellipse at 50% 38%, black 0%, transparent 72%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 38%, black 0%, transparent 72%)',
      }}
    >
      <g stroke={colors.sky} strokeWidth={0.6} opacity={0.05}>
        {links.map((link) => (
          <line key={link.id} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2} />
        ))}
      </g>
      <g fill={colors.sky} opacity={0.11}>
        {dots.map((dot) => (
          <circle key={dot.id} cx={dot.x} cy={dot.y} r={dot.r} />
        ))}
      </g>
    </svg>
  )
}
