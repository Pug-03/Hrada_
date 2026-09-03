import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

/**
 * True on a coarse (touch/stylus) primary pointer — a capability check, not a
 * viewport check, so a touch-enabled laptop with a mouse plugged in reads
 * false once a real mouse is what's driving hover. Mirrors framer-motion's
 * useReducedMotion (matchMedia + a change listener) since the constellation
 * gates mouse-only effects off the same way it already gates motion off.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setCoarse(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return coarse
}
