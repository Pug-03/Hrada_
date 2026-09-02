import { ShieldAlert } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { homeFor, type Session } from '@/lib/permissions'
import { useSession } from '@/store/session'

/**
 * The supplementary screen from §11. An Employee who navigates straight to
 * /recruit lands here rather than seeing an empty page, and it says which
 * roles the screen is for and where they can go instead.
 */
export default function NotAuthorized() {
  const session = useSession() as unknown as Session
  const location = useLocation()
  const reason = (location.state as { reason?: string } | null)?.reason
  const attempted = (location.state as { attempted?: string } | null)?.attempted

  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="px-6 py-8 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-warn/10 text-warn">
          <ShieldAlert size={18} />
        </span>
        <h1 className="mt-4 text-title font-semibold">เข้าหน้านี้ไม่ได้</h1>
        <p className="mt-2 text-body leading-relaxed text-haze">
          {reason ?? 'บทบาทปัจจุบันของคุณไม่มีสิทธิ์เข้าถึงหน้านี้'}
        </p>
        {attempted ? (
          <p className="mt-2 text-micro text-haze">
            หน้าที่พยายามเข้า: <span className="num">{attempted}</span>
          </p>
        ) : null}
        <p className="mt-4 text-small leading-relaxed text-haze">
          สิทธิ์การเข้าถึงกำหนดตามบทบาท เพื่อให้ข้อมูลผลงานและค่าตอบแทนของแต่ละคนถูกเห็นเฉพาะคนที่ต้องใช้จริง
          หากต้องการดูหน้านี้ ให้สลับบทบาทจากมุมขวาบน
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to={homeFor(session)}>
            <Button variant="primary">กลับไปหน้าหลักของบทบาทนี้</Button>
          </Link>
          <Link to="/">
            <Button variant="secondary">เลือกบทบาทใหม่</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
