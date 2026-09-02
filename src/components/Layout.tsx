import { motion, useReducedMotion } from 'framer-motion'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { ORG } from '@/data/employees'
import { cn } from '@/lib/cn'
import { navFor, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

import { RoleSwitcher } from './RoleSwitcher'
import { ToastHost } from './ui/Toast'

export function Layout() {
  const session = useSession() as unknown as Session
  const nav = navFor(session)
  const location = useLocation()
  const reduced = useReducedMotion()

  return (
    <div className="flex min-h-screen">
      {/* No role, no rail — the entry screen is its own thing. */}
      {session.role ? (
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-panel/60 px-3 py-4 lg:flex">
          <div className="px-2 pb-5">
            <p className="text-[20px] font-semibold tracking-tight">HRADA</p>
            <p className="mt-0.5 text-[11px] text-haze">
              {ORG.name} · <span className="num">{ORG.totalHeadcount}</span> คน
            </p>
          </div>
          <nav className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[13px] transition-colors duration-150',
                    isActive
                      ? 'bg-signal/15 text-text'
                      : 'text-haze hover:bg-panel-raised hover:text-text',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <p className="mt-auto px-3 text-[11px] leading-relaxed text-haze">
            HRADA วิเคราะห์ เสนอแนะ และอธิบายเหตุผล — คนเป็นผู้ตัดสินใจเสมอ
          </p>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-ink/85 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="text-[15px] font-semibold">HRADA</span>
          </div>
          <div className="hidden text-[13px] text-haze lg:block">
            Put the Right Person in the Right Job and Grow the Right Skills
          </div>
          <RoleSwitcher />
        </header>

        <motion.main
          key={location.pathname}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-6"
        >
          <Outlet />
        </motion.main>
      </div>

      <ToastHost />
    </div>
  )
}
