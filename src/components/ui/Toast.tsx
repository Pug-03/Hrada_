import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'

import { useToast } from '@/store/toast'

/**
 * §5 — confirmation slides in from the top right and dismisses itself. The
 * wording mirrors the button that caused it, so "Schedule Interview" produces
 * "นัดสัมภาษณ์แล้ว" rather than a generic success message.
 */
export function ToastHost() {
  const toasts = useToast((s) => s.toasts)
  const dismiss = useToast((s) => s.dismiss)
  const reduced = useReducedMotion()

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout={!reduced}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.98 }}
            transition={reduced ? { duration: 0.12 } : { type: 'spring', stiffness: 300, damping: 26 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-line bg-panel-raised px-3.5 py-2.5 text-[13px] shadow-lg shadow-black/40"
            onClick={() => dismiss(toast.id)}
            role="status"
          >
            <motion.span
              initial={reduced ? false : { scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.05 }}
              className="grid size-5 place-items-center rounded-full bg-sky/15 text-sky"
            >
              <Check size={12} strokeWidth={3} />
            </motion.span>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
