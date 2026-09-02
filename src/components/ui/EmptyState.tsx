import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * §5 — empty states are never static: the icon breathes gently, and the copy
 * says what to do next rather than reporting that there is nothing here.
 */
export function EmptyState({
  icon: Icon,
  title,
  action,
}: {
  icon: LucideIcon
  title: string
  action: ReactNode
}) {
  const reduced = useReducedMotion()
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-panel/40 px-6 py-14 text-center">
      <motion.span
        className="grid size-11 place-items-center rounded-full bg-panel-raised text-haze"
        animate={reduced ? {} : { scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={18} />
      </motion.span>
      <p className="max-w-sm text-[15px] text-text">{title}</p>
      <div className="text-[13px] text-haze">{action}</div>
    </div>
  )
}
