import { motion, useReducedMotion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { ORG } from '@/data/employees'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import { navFor, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

import { LanguageSwitcher } from './LanguageSwitcher'
import { NavDrawer } from './NavDrawer'
import { NavRail } from './NavRail'
import { RoleSwitcher } from './RoleSwitcher'
import { NumericText } from './ui/NumericText'
import { ToastHost } from './ui/Toast'

/**
 * Three nav tiers, one per breakpoint (§ responsive pass):
 *   — <640: the sidebar has nowhere to go, so nav lives behind NavDrawer,
 *     opened from a hamburger in the header. The switchers move in there too.
 *   — 640–1023: NavRail, an icon-only rail — there's room for persistent nav,
 *     just not the full-width sidebar.
 *   — ≥1024: the full sidebar, unchanged.
 * All three are always in the DOM; Tailwind's breakpoint classes are what
 * decide which one is visible, the same pattern every other screen in this
 * pass uses rather than a JS-driven remount on resize.
 */
export function Layout() {
  const session = useSession() as unknown as Session
  const nav = navFor(session)
  const location = useLocation()
  const reduced = useReducedMotion()
  const t = useT()
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Closed on navigation. Adjusted during render rather than in an effect —
  // the React-recommended way to reset state when a prop changes, since it
  // skips the extra render an effect-driven setState would cost here.
  const [drawerPath, setDrawerPath] = useState(location.pathname)
  if (location.pathname !== drawerPath) {
    setDrawerPath(location.pathname)
    setDrawerOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* No role, no nav — the entry screen is its own thing. */}
      {session.role ? (
        <>
          <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={nav} />
          <NavRail nav={nav} />
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
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-ink/85 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {session.role ? (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label={t('app.openMenu')}
                className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 -ml-1.5 grid place-items-center rounded-lg p-2 text-haze transition-colors duration-150 hover:bg-panel-raised hover:text-text sm:hidden"
              >
                <Menu size={20} />
              </button>
            ) : null}
            <span className="text-body font-semibold lg:hidden">HRADA</span>
          </div>
          <div className="hidden text-small text-haze lg:block">{t('app.tagline')}</div>
          <div className="hidden items-center gap-2 sm:flex">
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
