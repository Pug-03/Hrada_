import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

import { useT } from '@/lib/i18n'
import { motion as motionTokens } from '@/lib/theme'

/**
 * §5 — explanation panels slide in from the right over a fading backdrop, on a
 * medium-stiffness spring. Every "Why this match?" and "Why this pick?" in the
 * product opens the same way, because they are the same kind of answer.
 */
export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()
  const t = useT()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-[2px]"
          />
          <motion.aside
            key="panel"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={reduced ? { duration: 0.12 } : motionTokens.panel}
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-120 flex-col border-l border-line bg-panel"
            role="dialog"
            aria-label={title}
          >
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-section font-semibold">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-small text-haze">{subtitle}</p> : null}
              </div>
              <button
                onClick={onClose}
                aria-label={t('common.closePanel')}
                className="rounded-md p-1.5 text-haze transition-colors hover:bg-panel-raised hover:text-text"
              >
                <X size={16} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
