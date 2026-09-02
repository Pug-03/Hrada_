import { ShieldAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import type { DeniedState } from '@/components/DeniedState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { useT } from '@/lib/i18n'
import { denialReason, homeFor, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

/**
 * The supplementary screen from §11. An Employee who navigates straight to
 * /recruit lands here rather than seeing an empty page, and it says which
 * roles the screen is for and where they can go instead.
 */
export default function NotAuthorized() {
  const session = useSession() as unknown as Session
  const location = useLocation()
  const t = useT()
  const state = location.state as DeniedState | null

  const reason = state?.screen
    ? denialReason(session, state.screen, t)
    : t('denied.generic')
  const message = state?.suffixKey ? `${reason} — ${t(state.suffixKey)}` : reason

  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="px-6 py-8 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-warn/10 text-warn">
          <ShieldAlert size={18} />
        </span>
        <h1 className="mt-4 text-title font-semibold">{t('denied.title')}</h1>
        <p className="mt-2 text-body leading-relaxed text-haze">{message}</p>
        {state?.attempted ? (
          <p className="mt-2 text-micro text-haze">
            <NumericText>{t('denied.attempted', { path: state.attempted })}</NumericText>
          </p>
        ) : null}
        <p className="mt-4 text-small leading-relaxed text-haze">{t('denied.explain')}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to={homeFor(session)}>
            <Button variant="primary">{t('denied.home')}</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">{t('denied.pick')}</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
