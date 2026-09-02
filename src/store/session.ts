import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { persistedStorage } from './storage'

import type { Department, UserRole } from '@/data/types'

interface SessionState {
  role: UserRole | null
  /** Which department a Manager leads — scopes everything they can see. */
  managerDepartment: Department | null
  /** Which of the 14 people an Employee is signed in as. */
  employeeId: string | null
  signInAsHR: () => void
  signInAsCEO: () => void
  signInAsManager: (department: Department) => void
  signInAsEmployee: (employeeId: string) => void
  signOut: () => void
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      managerDepartment: null,
      employeeId: null,
      signInAsHR: () => set({ role: 'HR', managerDepartment: null, employeeId: null }),
      signInAsCEO: () => set({ role: 'CEO', managerDepartment: null, employeeId: null }),
      signInAsManager: (department) =>
        set({ role: 'Manager', managerDepartment: department, employeeId: null }),
      signInAsEmployee: (employeeId) =>
        set({ role: 'Employee', managerDepartment: null, employeeId }),
      signOut: () => set({ role: null, managerDepartment: null, employeeId: null }),
    }),
    { name: 'hrada-session', storage: persistedStorage<SessionState>() },
  ),
)
