import { useState } from 'react'

/**
 * §5 — a button that triggers an analysis holds a named loading state for
 * 600–900ms. Long enough for the user to read what is being computed, short
 * enough not to feel like theatre.
 */
export function useAnalysis(durationMs = 750) {
  const [running, setRunning] = useState(false)
  const run = (then?: () => void) => {
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      then?.()
    }, durationMs)
  }
  return { running, run }
}
