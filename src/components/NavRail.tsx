import { motion, useReducedMotion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  UserPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import type { NavItem, Screen } from '@/lib/permissions'

const SCREEN_ICON: Record<Screen, LucideIcon> = {
  dashboard: LayoutDashboard,
  employees: Users,
  recruit: UserPlus,
  'team-matching': UsersRound,
  learning: GraduationCap,
  tracking: Activity,
  insights: BarChart3,
}

/**
 * 640–1023px — the tablet tier of §-nav. The full sidebar (`Layout.tsx`)
 * needs room `hidden lg:flex` never gives below 1024, so this is a narrower,
 * always-visible rail rather than the desktop sidebar shrunk down: icon-only
 * by default, with a toggle that expands labels back in when there's a
 * reason to check one.
 */
export function NavRail({ nav }: { nav: NavItem[] }) {
  const [expanded, setExpanded] = useState(false)
  const reduced = useReducedMotion()
  const t = useT()

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-panel/60 py-4 sm:flex lg:hidden',
        expanded ? 'w-52 px-3' : 'w-16 px-2',
      )}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-label={expanded ? t('app.collapseNav') : t('app.expandNav')}
        aria-expanded={expanded}
        className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 mb-4 flex items-center justify-center self-start rounded-lg p-2 text-haze transition-colors duration-150 hover:bg-panel-raised hover:text-text"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          className="flex"
        >
          <ChevronRight size={16} />
        </motion.span>
      </button>

      <nav className="flex flex-col gap-0.5">
        {nav.map((item) => {
          const Icon = SCREEN_ICON[item.screen]
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={t(item.labelKey)}
              className={({ isActive }) =>
                cn(
                  'pointer-coarse:min-h-11 flex items-center gap-3 rounded-lg px-2.5 py-2 text-small transition-colors duration-150',
                  isActive ? 'bg-signal/15 text-text' : 'text-haze hover:bg-panel-raised hover:text-text',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {expanded ? <span className="truncate">{t(item.labelKey)}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
