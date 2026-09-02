import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { persistedStorage } from './storage'

/**
 * HR's decisions on candidates. Nothing here is ever set by the system —
 * §12 forbids the product deciding anything about a person, so every value in
 * this store arrives from a human pressing a button.
 */
export type CandidateDecision = 'interview' | 'pass' | 'reject'

interface DecisionState {
  decisions: Record<string, CandidateDecision>
  decide: (candidateId: string, decision: CandidateDecision) => void
  undo: (candidateId: string) => void
  reset: () => void
}

export const useDecisions = create<DecisionState>()(
  persist(
    (set) => ({
      decisions: {},
      decide: (candidateId, decision) =>
        set((state) => ({ decisions: { ...state.decisions, [candidateId]: decision } })),
      undo: (candidateId) =>
        set((state) => {
          const next = { ...state.decisions }
          delete next[candidateId]
          return { decisions: next }
        }),
      reset: () => set({ decisions: {} }),
    }),
    { name: 'hrada-decisions', storage: persistedStorage<DecisionState>() },
  ),
)
