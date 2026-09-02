import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { canOpen, type Screen, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

import type { DeniedState } from './DeniedState'

/**
 * §8 — the gate is on the route, not on the markup. A denied navigation is
 * redirected with the screen it tried to open, and NotAuthorized renders the
 * reason at display time — passing a screen id rather than a rendered string
 * means the message still matches the language the viewer switches to later.
 */
export function RequireAccess({ screen, children }: { screen: Screen; children: ReactNode }) {
  const session = useSession() as unknown as Session
  const location = useLocation()

  if (!session.role) return <Navigate to="/" replace />

  if (!canOpen(session, screen)) {
    const state: DeniedState = { screen, attempted: location.pathname }
    return <Navigate to="/not-authorized" replace state={state} />
  }

  return <>{children}</>
}
