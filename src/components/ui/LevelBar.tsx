import { motion, useReducedMotion } from 'framer-motion'

import { bandFor } from '@/data/skills'
import { cn } from '@/lib/cn'

/**
 * A skill level as a bar. §5 — the fill animates on first mount only, so
 * scrolling back to a profile does not replay the whole page.
 */
export function LevelBar({
  level,
  max = 5,
  required,
  className,
  animateOnMount = true,
}: {
  level: number
  max?: number
  /** Draws the target line for a role requirement, when there is one. */
  required?: number
  className?: string
  animateOnMount?: boolean
}) {
  const reduced = useReducedMotion()
  const pct = Math.min(100, (level / max) * 100)
  const meets = required === undefined || level >= required
  return (
    <div className={cn('relative h-1.5 w-full rounded-full bg-line/70', className)}>
      <motion.div
        className={cn('h-full rounded-full', meets ? 'bg-sky' : 'bg-warn')}
        initial={animateOnMount && !reduced ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: reduced ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        aria-label={`${level.toFixed(1)} จาก ${max} — ${bandFor(level).name}`}
      />
      {required !== undefined ? (
        <span
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-text/60"
          style={{ left: `${Math.min(100, (required / max) * 100)}%` }}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
