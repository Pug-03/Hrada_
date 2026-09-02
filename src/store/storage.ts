import { createJSONStorage, type PersistStorage } from 'zustand/middleware'

/**
 * localStorage is not always there: private windows, browsers set to block
 * site data, and non-browser environments all throw on access rather than
 * returning null. Persistence is a convenience here — a demo surviving a
 * refresh — so a failure falls back to memory instead of breaking the app.
 */
function safeStorage(): Storage {
  try {
    const probe = '__hrada_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const memory = new Map<string, string>()
    return {
      get length() {
        return memory.size
      },
      clear: () => memory.clear(),
      getItem: (key) => memory.get(key) ?? null,
      key: (index) => [...memory.keys()][index] ?? null,
      removeItem: (key) => void memory.delete(key),
      setItem: (key, value) => void memory.set(key, value),
    }
  }
}

export function persistedStorage<T>(): PersistStorage<T> | undefined {
  return createJSONStorage<T>(safeStorage)
}
