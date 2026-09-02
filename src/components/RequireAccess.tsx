import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { canOpen, denialReason, type Screen, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

/**
 * §8 — the gate is on the route, not on the markup. A denied navigation is
 * redirected with the reason attached, so the not-authorized screen can say
 * something specific instead of "access denied".
 */
export function RequireAccess({ screen, children }: { screen: Screen; children: ReactNode }) {
  const session = useSession() as unknown as Session
  const location = useLocation()

  if (!session.role) return <Navigate to="/" replace />

  if (!canOpen(session, screen)) {
    return (
      <Navigate
        to="/not-authorized"
        replace
        state={{ reason: denialReason(session, screen), attempted: location.pathname }}
      />
    )
  }

  return <>{children}</>
}
