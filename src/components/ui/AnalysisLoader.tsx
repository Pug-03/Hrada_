import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { NumericText } from './NumericText'

/**
 * §5 — the loading state for anything described as an analysis. It names what
 * is being analysed rather than spinning: "Analysing the Skill Graph of
 * 114 employees" (or the Thai equivalent).
 */
export function AnalysisLoader({ message, rows = 3 }: { message: string; rows?: number }) {
  const reduced = useReducedMotion()
  const [dots, setDots] = useState(1)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setDots((d) => (d % 3) + 1), 260)
    return () => window.clearInterval(id)
  }, [reduced])

  return (
    <div className="rounded-xl border border-line bg-panel p-5" role="status" aria-live="polite">
      <p className="text-small text-sky">
        <NumericText>{message}</NumericText>
        <span className="num">{'.'.repeat(reduced ? 3 : dots)}</span>
      </p>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            className="h-9 rounded-lg bg-panel-raised"
            initial={{ opacity: 0.35 }}
            animate={reduced ? { opacity: 0.35 } : { opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  )
}
