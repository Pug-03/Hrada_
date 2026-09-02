import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EMPLOYEES } from '@/data/employees'
import { ORG } from '@/data/employees'
import type { Department } from '@/data/types'
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

  const label =
    session.role === 'Manager'
      ? `Manager · ${session.managerDepartment}`
      : session.role === 'Employee'
        ? `Employee · ${EMPLOYEES.find((e) => e.id === session.employeeId)?.name ?? ''}`
        : (session.role ?? 'เลือกบทบาท')

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
        className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-[13px] transition-colors duration-150 hover:bg-panel-raised"
        aria-expanded={open}
      >
        <span className="text-haze">บทบาท</span>
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
              className="absolute right-0 z-40 mt-2 w-[300px] rounded-xl border border-line bg-panel p-2 shadow-xl shadow-black/50"
            >
              <Group label="ทั้งองค์กร">
                <Item onClick={() => go(useSession.getState().signInAsHR)}>HR / HR Manager</Item>
                <Item onClick={() => go(useSession.getState().signInAsCEO)}>CEO / Business Owner</Item>
              </Group>
              <Group label="Manager — เลือกแผนกที่ดูแล">
                {ORG.departments.map((department) => (
                  <Item
                    key={department}
                    onClick={() => go(() => useSession.getState().signInAsManager(department as Department))}
                  >
                    {department}
                  </Item>
                ))}
              </Group>
              <Group label="Employee — เลือกว่าเป็นใคร">
                <div className="max-h-52 overflow-y-auto">
                  {EMPLOYEES.map((employee) => (
                    <Item
                      key={employee.id}
                      onClick={() => go(() => useSession.getState().signInAsEmployee(employee.id))}
                    >
                      {employee.name}
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
      <p className="px-2 py-1 text-[11px] text-haze">{label}</p>
      {children}
    </div>
  )
}

function Item({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-150 hover:bg-panel-raised"
    >
      {children}
    </button>
  )
}
