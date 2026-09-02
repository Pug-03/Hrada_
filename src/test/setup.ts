/**
 * jsdom lacks the two browser APIs the chart and motion layers reach for.
 * Both are stubbed rather than mocked away, so components still take their
 * real code paths during the render smoke tests.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof matchMedia
}

/**
 * Node 26's jsdom environment does not expose localStorage as a global, so the
 * persistence layer gets a real one here rather than silently falling back to
 * memory and testing a path the browser never takes.
 */
if (typeof globalThis.localStorage === 'undefined' && typeof window !== 'undefined') {
  const memory = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return memory.size
    },
    clear: () => memory.clear(),
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => [...memory.keys()][index] ?? null,
    removeItem: (key: string) => void memory.delete(key),
    setItem: (key: string, value: string) => void memory.set(key, value),
  }
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
}
