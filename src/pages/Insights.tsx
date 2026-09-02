import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { insightScope, visibleEmployees, type Session } from '@/lib/permissions'
import { generateInsights, type Insight } from '@/lib/scoring'
import { useSession } from '@/store/session'

/**
 * §11 Screen 8. Grouped by urgency, every card expands to the numbers it came
 * from and the rule that produced it, and every card ends in a link to the
 * screen where something can actually be done about it.
 *
 * At-Risk is the long group on this dataset — a 14-person company is one deep
 * in most things — so it shows the five thinnest benches first and expands to
 * the rest on request, rather than burying the critical finding under them.
 */
const GROUPS: {
  kind: Insight['kind']
  title: string
  hint: string
  /** Only At-Risk is capped — it is the long group, and it buries the rest. */
  cap?: number
  capNote?: string
}[] = [
  {
    kind: 'Critical Skill Gap',
    title: 'ต้องแก้ก่อน',
    hint: 'มีงานที่รับปากไว้แล้ว แต่ไม่มีใครทำได้ถึงระดับที่ต้องการ',
  },
  {
    kind: 'At-Risk Skill',
    title: 'พึ่งคนคนเดียวอยู่',
    hint: 'มีคนเดียวในองค์กรที่ทำ skill นี้ได้ถึงระดับ 4.0',
    cap: 5,
    capNote: 'เรียงจากคนสำรองที่อ่อนที่สุดก่อน — ข้อบนสุดคือ skill ที่คนถัดไปห่างจากเจ้าของ skill มากที่สุด',
  },
  {
    kind: 'Workload Risk',
    title: 'คนที่รับงานหนักเกินไป',
    hint: 'Workload เกิน 85% และเป็นคนที่ผลงานสูง — กลุ่มที่เสี่ยงจะหมดไฟที่สุด',
  },
  {
    kind: 'Growth Opportunity',
    title: 'โอกาส',
    hint: 'คนที่กำลังโตเร็ว และคนที่พร้อมสำหรับตำแหน่งถัดไป',
  },
]

export default function Insights() {
  const session = useSession() as unknown as Session
  const employees = useMemo(() => visibleEmployees(session), [session])
  const insights = useMemo(() => generateInsights(employees), [employees])
  const scope = insightScope(session)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold">AI Workforce Insights</h1>
        <p className="mt-1 text-[13px] text-haze">
          {scope === 'team'
            ? `ขอบเขตข้อมูล: ทีม ${session.managerDepartment} เท่านั้น`
            : 'ขอบเขตข้อมูล: ทั้งองค์กร'}{' '}
          · ทุกข้อกดดูได้ว่าคำนวณจากอะไรและใช้สูตรไหน
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = insights.filter((i) => i.kind === group.kind)
        if (items.length === 0) return null
        return <InsightGroup key={group.kind} group={group} items={items} />
      })}
    </div>
  )
}

function InsightGroup({
  group,
  items,
}: {
  group: (typeof GROUPS)[number]
  items: Insight[]
}) {
  const [expanded, setExpanded] = useState(false)
  const cap = group.cap ?? Number.POSITIVE_INFINITY
  const shown = expanded ? items : items.slice(0, cap)
  const hidden = items.length - shown.length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold">
          {group.title}
          <span className="num ml-2 text-[13px] text-haze">{items.length}</span>
        </h2>
        <p className="text-[11px] text-haze">
          <NumericText>{group.hint}</NumericText>
        </p>
      </div>

      <ul className="mt-3 space-y-2">
        {shown.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ul>

      {hidden > 0 || expanded ? (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2.5 text-[13px] text-sky transition-colors duration-150 hover:text-text"
        >
          {expanded ? (
            'ย่อกลับ'
          ) : (
            <>
              แสดงทั้งหมด <Num value={items.length} /> ข้อ (ซ่อนอยู่ <Num value={hidden} />)
            </>
          )}
        </button>
      ) : null}

      {group.capNote && hidden > 0 ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-haze">
          <NumericText>{group.capNote}</NumericText>
        </p>
      ) : null}
    </section>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  const tone =
    insight.severity === 'critical' ? 'critical' : insight.severity === 'warn' ? 'warn' : 'sky'

  return (
    <li>
      <Card
        tone="flat"
        className={
          insight.severity === 'critical'
            ? 'border-critical/40'
            : insight.severity === 'warn'
              ? 'border-warn/30'
              : ''
        }
      >
        <button
          className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <div className="min-w-0">
            <p className="text-[15px] leading-relaxed">
              <NumericText>{insight.title}</NumericText>
            </p>
            <p className="mt-1 text-[11px] text-haze">แตะเพื่อดูว่าคำนวณจากอะไร</p>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <Badge tone={tone}>{insight.kind}</Badge>
            <ChevronDown
              size={14}
              className={`text-haze transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-line/70 px-4 py-3.5">
                <div>
                  <p className="text-[11px] text-haze">คำนวณจาก</p>
                  <p className="mt-1 text-[13px] leading-relaxed">
                    <NumericText>{insight.computedFrom}</NumericText>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-haze">สูตรที่ใช้</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-haze">
                    <NumericText>{insight.formula}</NumericText>
                  </p>
                </div>
                <Link to={insight.action.to}>
                  <Button variant="primary">{insight.action.label}</Button>
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </li>
  )
}
