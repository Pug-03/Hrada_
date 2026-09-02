import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { EntryBackdrop } from '@/components/EntryBackdrop'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EMPLOYEES, ORG } from '@/data/employees'
import type { Department } from '@/data/types'
import { homeFor } from '@/lib/permissions'
import { useSession } from '@/store/session'

/**
 * §11 Screen 1 — pick a role, and see what the product is for before picking.
 * The loop strip is a compact orienting moment, not a landing page: the point
 * of HRADA is that the four stages feed each other, and that reads faster as a
 * diagram than as a paragraph.
 */
const LOOP = [
  { key: 'RECRUIT', th: 'หาคนที่ใช่' },
  { key: 'MATCH', th: 'จับคู่กับงานที่ใช่' },
  { key: 'DEVELOP', th: 'พัฒนา skill ที่ใช่' },
  { key: 'TRACK', th: 'ติดตามการเติบโต' },
]

export default function Entry() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()

  const enter = (fn: () => void) => {
    fn()
    navigate(homeFor(useSession.getState()))
  }

  return (
    <div className="relative isolate mx-auto max-w-3xl py-6">
      <EntryBackdrop />
      <p className="text-[13px] text-haze">
        {ORG.name} · {ORG.industry} · <span className="num">{ORG.totalHeadcount}</span> คน
        <span className="text-haze/70">
          {' '}
          (ตัวอย่างในระบบนี้ <span className="num">{EMPLOYEES.length}</span> คน)
        </span>
      </p>
      <h1 className="mt-2 text-[40px] leading-[1.1] font-semibold tracking-tight">HRADA</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-haze">
        AI Workforce Intelligence — เห็นว่าคนที่มีอยู่แล้วเก่งอะไร เหมาะกับงานไหน ยังขาดอะไร และควรโตทางไหน
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3">
        {LOOP.map((stage, i) => (
          <motion.div
            key={stage.key}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.08 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            <div className="rounded-lg border border-line bg-panel px-3 py-2">
              <p className="text-[13px] font-semibold">{stage.key}</p>
              <p className="text-[11px] text-haze">{stage.th}</p>
            </div>
            {i < LOOP.length - 1 ? <ArrowRight size={14} className="text-haze/60" /> : null}
          </motion.div>
        ))}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.36, duration: 0.3 }}
          className="flex items-center gap-1.5 text-[11px] text-haze"
        >
          <RotateCcw size={13} />
          ข้อมูลใหม่ย้อนกลับเข้า RECRUIT
        </motion.div>
      </div>

      <div className="mt-9 grid gap-3 sm:grid-cols-2">
        <Card className="p-4" tone="flat">
          <h2 className="text-[15px] font-semibold">เข้าใช้งานแบบทั้งองค์กร</h2>
          <p className="mt-1 text-[13px] text-haze">เห็นข้อมูลของทุกแผนก</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => enter(useSession.getState().signInAsHR)}>
              HR / HR Manager
            </Button>
            <Button onClick={() => enter(useSession.getState().signInAsCEO)}>CEO / Business Owner</Button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-haze">
            HR เห็นทุกอย่างรวมถึงการรับสมัครและ Salary Range · CEO เห็นภาพรวมกำลังคนแต่ไม่เห็นข้อมูลผู้สมัครและค่าตอบแทน
          </p>
        </Card>

        <Card className="p-4" tone="flat">
          <h2 className="text-[15px] font-semibold">เข้าใช้งานแบบ Manager</h2>
          <p className="mt-1 text-[13px] text-haze">เห็นเฉพาะทีมที่ดูแล</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ORG.departments.map((department) => (
              <Button
                key={department}
                onClick={() =>
                  enter(() => useSession.getState().signInAsManager(department as Department))
                }
              >
                {department}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:col-span-2" tone="flat">
          <h2 className="text-[15px] font-semibold">เข้าใช้งานแบบพนักงาน</h2>
          <p className="mt-1 text-[13px] text-haze">
            เห็นเฉพาะ skill ของตัวเอง Skill Gap ของตัวเอง และ Learning Path ของตัวเอง
          </p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {EMPLOYEES.map((employee) => (
              <button
                key={employee.id}
                onClick={() => enter(() => useSession.getState().signInAsEmployee(employee.id))}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-line/70 px-3 py-2 text-left text-[13px] transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-panel-raised"
              >
                <span className="truncate">{employee.name}</span>
                <span className="shrink-0 text-[11px] text-haze">{employee.title}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card tone="quiet" className="mt-4 p-4">
        <p className="text-[13px] leading-relaxed text-haze">
          HRADA เป็น Decision-Support System — วิเคราะห์ เสนอแนะ อธิบายเหตุผล แล้วให้คนตัดสินใจ
          ไม่มีฟีเจอร์ใดตัดคนออกหรือตัดสินใจแทนคนโดยอัตโนมัติ และทุกตัวเลขกดดูที่มาได้
        </p>
        <p className="mt-2 text-[11px] text-haze">
          ตัวเลขทั้งหมดคำนวณสด — ทุกค่ามาจากฟังก์ชันใน <span className="num">src/lib/scoring.ts</span>{' '}
          ไม่มีการเขียนตัวเลขทับไว้
        </p>
      </Card>
    </div>
  )
}
