import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { persistedStorage } from './storage'

/**
 * Learning Path progress per person. Two states rather than one, because
 * §10.11 measures started (Employee Engagement in Development Plan) and
 * completed (Skill Completion Rate) as different things.
 */
interface LearningState {
  started: Record<string, string[]>
  completed: Record<string, string[]>
  toggleStarted: (employeeId: string, stepId: string) => void
  toggleCompleted: (employeeId: string, stepId: string) => void
  reset: () => void
}

const toggle = (list: string[] = [], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id]

export const useLearning = create<LearningState>()(
  persist(
    (set) => ({
      started: {},
      completed: {},
      toggleStarted: (employeeId, stepId) =>
        set((state) => ({
          started: { ...state.started, [employeeId]: toggle(state.started[employeeId], stepId) },
        })),
      /** Completing a step implies it was started. */
      toggleCompleted: (employeeId, stepId) =>
        set((state) => {
          const completed = toggle(state.completed[employeeId], stepId)
          const nowComplete = completed.includes(stepId)
          const started = nowComplete
            ? [...new Set([...(state.started[employeeId] ?? []), stepId])]
            : (state.started[employeeId] ?? [])
          return {
            completed: { ...state.completed, [employeeId]: completed },
            started: { ...state.started, [employeeId]: started },
          }
        }),
      reset: () => set({ started: {}, completed: {} }),
    }),
    { name: 'hrada-learning', storage: persistedStorage<LearningState>() },
  ),
)
