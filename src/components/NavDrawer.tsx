import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import type { NavItem } from '@/lib/permissions'

import { LanguageSwitcher } from './LanguageSwitcher'
import { RoleSwitcher } from './RoleSwitcher'

/**
 * <640px — the sidebar has nowhere to go, so nav lives behind a hamburger
 * instead. The role/language switchers move in here too rather than staying
 * in the header, which has no room for them at this width once the hamburger
 * and the HRADA wordmark are both there.
 */
export function NavDrawer({
  open,
  onClose,
  nav,
}: {
  open: boolean
  onClose: () => void
  nav: NavItem[]
}) {
  const reduced = useReducedMotion()
  const t = useT()

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink/70 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('app.openMenu')}
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto border-r border-line bg-panel px-4 py-4 sm:hidden"
            initial={reduced ? { opacity: 0 } : { x: '-100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: '-100%' }}
            transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between">
              <p className="text-section font-semibold tracking-tight">HRADA</p>
              <button
                onClick={onClose}
                aria-label={t('app.closeMenu')}
                className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 grid place-items-center rounded-lg p-2 text-haze transition-colors duration-150 hover:bg-panel-raised hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-start gap-2">
              <LanguageSwitcher />
              <RoleSwitcher />
            </div>

            <nav className="flex flex-col gap-1 border-t border-line/70 pt-3">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'pointer-coarse:min-h-11 flex items-center rounded-lg px-3 py-2.5 text-small transition-colors duration-150',
                      isActive ? 'bg-signal/15 text-text' : 'text-haze hover:bg-panel-raised hover:text-text',
                    )
                  }
                >
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
