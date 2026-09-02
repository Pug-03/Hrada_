/**
 * §8 — who sees what.
 *
 * These rules gate routing and data, not just rendering. An Employee who types
 * /recruit into the address bar is redirected to an explanation, because
 * hiding a menu item with CSS is not a permission model.
 */
import { EMPLOYEES } from '@/data/employees'
import type { Department, Employee, UserRole } from '@/data/types'
import type { TFunction, TranslationKey } from '@/lib/i18n'

export interface Session {
  role: UserRole | null
  managerDepartment: Department | null
  employeeId: string | null
}

export type Screen =
  | 'dashboard'
  | 'employees'
  | 'recruit'
  | 'team-matching'
  | 'learning'
  | 'tracking'
  | 'insights'

/**
 * CEO is the fourth role from §1. §8's table covers HR, Manager and Employee
 * only, so the CEO row is derived from §1's description — Workforce Health,
 * org-wide skill gaps, talent and workforce overview. That means everything HR
 * sees except the hiring pipeline and salary bands, which stay with HR.
 */
const SCREEN_ACCESS: Record<Screen, UserRole[]> = {
  dashboard: ['HR', 'Manager', 'CEO'],
  employees: ['HR', 'Manager', 'Employee', 'CEO'],
  recruit: ['HR'],
  'team-matching': ['HR', 'Manager'],
  learning: ['HR', 'Manager', 'Employee'],
  tracking: ['HR', 'Manager', 'Employee'],
  insights: ['HR', 'Manager', 'CEO'],
}

export function canOpen(session: Session, screen: Screen): boolean {
  if (!session.role) return false
  return SCREEN_ACCESS[screen].includes(session.role)
}

/**
 * Why a screen was refused — shown on the not-authorized page.
 *
 * Takes `t` rather than a locale so it works the same whether the caller is a
 * component (via useT()) or a route guard reading the store directly.
 */
export function denialReason(session: Session, screen: Screen, t: TFunction): string {
  const allowed = SCREEN_ACCESS[screen].join(' / ')
  if (!session.role) return t('denial.noRole')
  return t('denial.wrongRole', { allowed, role: session.role })
}

/** The set of people this session is allowed to look at at all (§8). */
export function visibleEmployees(session: Session, all: Employee[] = EMPLOYEES): Employee[] {
  switch (session.role) {
    case 'HR':
    case 'CEO':
      return all
    case 'Manager':
      return all.filter((e) => e.department === session.managerDepartment)
    case 'Employee':
      return all.filter((e) => e.id === session.employeeId)
    default:
      return []
  }
}

export function canViewEmployee(session: Session, employeeId: string): boolean {
  return visibleEmployees(session).some((e) => e.id === employeeId)
}

/** Performance and workload follow the same scope as the profile itself (§8). */
export function canViewPerformance(session: Session, employeeId: string): boolean {
  if (session.role === 'Employee') return session.employeeId === employeeId
  return canViewEmployee(session, employeeId)
}

export const canViewWorkload = canViewPerformance

/** Salary bands are HR-only — the one row in §8 with a single tick. */
export function canViewSalary(session: Session): boolean {
  return session.role === 'HR'
}

/**
 * Whether workforce numbers cover the whole company or just one team. A
 * Manager's dashboard is real, but scoped — §8 gives them "own team only".
 */
export function insightScope(session: Session): 'org' | 'team' | 'none' {
  if (session.role === 'HR' || session.role === 'CEO') return 'org'
  if (session.role === 'Manager') return 'team'
  return 'none'
}

export interface NavItem {
  screen: Screen
  to: string
  labelKey: TranslationKey
}

/** Screen names are product/HR terminology (§6) — identical text in both dictionaries. */
const NAV: NavItem[] = [
  { screen: 'dashboard', to: '/dashboard', labelKey: 'nav.dashboard' },
  { screen: 'employees', to: '/employees', labelKey: 'nav.employees' },
  { screen: 'recruit', to: '/recruit', labelKey: 'nav.recruit' },
  { screen: 'team-matching', to: '/team-matching', labelKey: 'nav.teamMatching' },
  { screen: 'learning', to: '/learning', labelKey: 'nav.learning' },
  { screen: 'tracking', to: '/tracking', labelKey: 'nav.tracking' },
  { screen: 'insights', to: '/insights', labelKey: 'nav.insights' },
]

export function navFor(session: Session): NavItem[] {
  return NAV.filter((item) => canOpen(session, item.screen))
}

/** Where a role lands after signing in. */
export function homeFor(session: Session): string {
  if (session.role === 'Employee') return `/employees/${session.employeeId}`
  if (!session.role) return '/'
  return '/dashboard'
}
