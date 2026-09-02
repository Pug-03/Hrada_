import { motion, useReducedMotion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { ORG } from '@/data/employees'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import { navFor, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

import { LanguageSwitcher } from './LanguageSwitcher'
import { RoleSwitcher } from './RoleSwitcher'
import { NumericText } from './ui/NumericText'
import { ToastHost } from './ui/Toast'

export function Layout() {
  const session = useSession() as unknown as Session
  const nav = navFor(session)
  const location = useLocation()
  const reduced = useReducedMotion()
  const t = useT()

  return (
    <div className="flex min-h-screen">
      {/* No role, no rail — the entry screen is its own thing. */}
      {session.role ? (
        <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col border-r border-line bg-panel/60 px-3 py-4 lg:flex">
          <div className="px-2 pb-5">
            <p className="text-section font-semibold tracking-tight">HRADA</p>
            <p className="mt-0.5 text-micro text-haze">
              {ORG.name} · <NumericText>{t('app.headcount', { count: ORG.totalHeadcount })}</NumericText>
            </p>
          </div>
          <nav className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-small transition-colors duration-150',
                    isActive
                      ? 'bg-signal/15 text-text'
                      : 'text-haze hover:bg-panel-raised hover:text-text',
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <p className="mt-auto px-3 text-micro leading-relaxed text-haze">{t('app.principle')}</p>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-ink/85 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="text-body font-semibold">HRADA</span>
          </div>
          <div className="hidden text-small text-haze lg:block">{t('app.tagline')}</div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <RoleSwitcher />
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-320 flex-1 px-5 py-6"
        >
          <Outlet />
        </motion.main>
      </div>

      <ToastHost />
    </div>
  )
}
