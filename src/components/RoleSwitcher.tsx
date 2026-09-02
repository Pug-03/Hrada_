import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EMPLOYEES, ORG } from '@/data/employees'
import type { Department } from '@/data/types'
import { useName, useT } from '@/lib/i18n'
import { homeFor } from '@/lib/permissions'
import { useSession } from '@/store/session'

/**
 * §8 / §11 Screen 1 — switching role re-routes rather than re-styling. The new
 * role lands on its own home screen, so an Employee never sits on a URL their
 * role cannot open.
 */
export function RoleSwitcher() {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const session = useSession()
  const t = useT()
  const name = useName()

  const label =
    session.role === 'Manager'
      ? `Manager · ${session.managerDepartment}`
      : session.role === 'Employee'
        ? `Employee · ${name(EMPLOYEES.find((e) => e.id === session.employeeId) ?? EMPLOYEES[0])}`
        : (session.role ?? t('role.choose'))

  const go = (fn: () => void) => {
    fn()
    setOpen(false)
    // Read the store after the update so the redirect matches the new role.
    setTimeout(() => navigate(homeFor(useSession.getState())), 0)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-small transition-colors duration-150 hover:bg-panel-raised"
        aria-expanded={open}
      >
        <span className="text-haze">{t('role.switch')}</span>
        <span>{label}</span>
        <ChevronDown size={14} className="text-haze" />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 z-40 mt-2 w-75 rounded-xl border border-line bg-panel p-2 shadow-xl shadow-black/50"
            >
              <Group label={t('role.groupOrg')}>
                <Item onClick={() => go(useSession.getState().signInAsHR)}>{t('role.hr')}</Item>
                <Item onClick={() => go(useSession.getState().signInAsCEO)}>{t('role.ceo')}</Item>
              </Group>
              <Group label={t('role.groupManager')}>
                {ORG.departments.map((department) => (
                  <Item
                    key={department}
                    onClick={() => go(() => useSession.getState().signInAsManager(department as Department))}
                  >
                    {department}
                  </Item>
                ))}
              </Group>
              <Group label={t('role.groupEmployee')}>
                <div className="max-h-52 overflow-y-auto">
                  {EMPLOYEES.map((employee) => (
                    <Item
                      key={employee.id}
                      onClick={() => go(() => useSession.getState().signInAsEmployee(employee.id))}
                    >
                      {name(employee)}
                      <span className="text-haze"> · {employee.title}</span>
                    </Item>
                  ))}
                </div>
              </Group>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line/70 py-1.5 last:border-0">
      <p className="px-2 py-1 text-micro text-haze">{label}</p>
      {children}
    </div>
  )
}

function Item({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full truncate rounded-md px-2 py-1.5 text-left text-small transition-colors duration-150 hover:bg-panel-raised"
    >
      {children}
    </button>
  )
}
