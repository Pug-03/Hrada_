import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

/** A hover/focus explanation. Keyboard reachable, because it carries meaning. */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: ReactNode
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      <AnimatePresence>
        {open ? (
          <motion.span
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            role="tooltip"
            className="absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[260px] -translate-x-1/2 rounded-lg border border-line bg-panel-raised px-2.5 py-1.5 text-left text-[11px] leading-relaxed text-text shadow-lg shadow-black/50"
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
