import { create } from 'zustand'

interface ToastItem {
  id: number
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

/** Not persisted: a confirmation that outlived the page would be a lie. */
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 3200)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
