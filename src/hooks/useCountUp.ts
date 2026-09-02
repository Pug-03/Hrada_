import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

import { motion as motionTokens } from '@/lib/theme'

/**
 * §5 — KPI numbers count to their value rather than snapping. Under
 * prefers-reduced-motion the final value is set immediately.
 */
export function useCountUp(target: number, durationSeconds = motionTokens.counter) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(0)
  const frame = useRef<number>(0)
  const from = useRef(0)

  useEffect(() => {
    // Reduced motion skips the animation entirely rather than setting state
    // synchronously here — the hook returns the target directly below.
    if (reduced) return
    const start = performance.now()
    const origin = from.current
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (durationSeconds * 1000))
      // Ease-out cubic: fast to begin, settles rather than stops.
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(origin + (target - origin) * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else from.current = target
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, durationSeconds, reduced])

  return reduced ? target : value
}
