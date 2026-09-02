import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'

import { CoverageBarChart } from '@/components/charts/Charts'
import { SkillConstellation } from '@/components/SkillConstellation/SkillConstellation'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { Tooltip } from '@/components/ui/Tooltip'
import { insightScope, visibleEmployees, type Session } from '@/lib/permissions'
import {
  calcWorkforceHealth,
  generateInsights,
  skillCoverageByDepartment,
  OWNERSHIP_BAR,
} from '@/lib/scoring'
import { useSession } from '@/store/session'

/**
 * §11 Screen 2 — the KPI row, the constellation as the hero, coverage by
 * department, and the auto-generated insights. A Manager sees the same screen
 * scoped to their own team (§8), and the scope is stated rather than implied.
 */
export default function Dashboard() {
  const session = useSession() as unknown as Session
  const reduced = useReducedMotion()
  const employees = useMemo(() => visibleEmployees(session), [session])
  const scope = insightScope(session)

  const health = useMemo(() => calcWorkforceHealth(employees), [employees])
  const coverage = useMemo(() => skillCoverageByDepartment(employees), [employees])
  const insights = useMemo(() => generateInsights(employees), [employees])

  const kpis = [
    {
      label: 'Employees',
      value: health.headcount,
      decimals: 0,
      explain: scope === 'team' ? 'จำนวนคนในทีมที่คุณดูแล' : 'จำนวนพนักงานที่อยู่ในระบบตัวอย่างนี้',
    },
    {
      label: 'Skill Coverage',
      value: health.skillCoverage * 100,
      suffix: '%',
      decimals: 0,
      explain: `สัดส่วน skill ที่งานเปิดรับและโครงการต้องการ แล้วมีคนถึงเกณฑ์อย่างน้อย 2 คน (${health.coveredSkills.length} จาก ${health.demand.length} skill)`,
    },
    {
      label: 'Critical Skill Gaps',
      value: health.criticalSkillGaps.length,
      decimals: 0,
      tone: health.criticalSkillGaps.length > 0 ? 'critical' : undefined,
      explain: 'skill ที่มีงานรออยู่จริง แต่ไม่มีใครในองค์กรทำได้ถึงระดับที่งานนั้นต้องการ',
    },
    {
      label: 'High Potential',
      value: health.highPotential.length,
      decimals: 0,
      explain: 'คนที่ Promotion Readiness ตั้งแต่ 75% ขึ้นไป',
    },
    {
      label: 'At-Risk Skills',
      value: health.atRiskSkills.length,
      decimals: 0,
      tone: health.atRiskSkills.length > 0 ? 'warn' : undefined,
      explain: `skill ที่มีคนเดียวในองค์กรทำได้ถึงระดับ ${OWNERSHIP_BAR.toFixed(1)} — ถ้าคนนั้นไม่อยู่ งานจะสะดุดทันที`,
    },
    {
      label: 'Internal Mobility',
      value: health.internalMobilityRate * 100,
      suffix: '%',
      decimals: 0,
      explain: 'สัดส่วนคนที่ผ่านเกณฑ์อย่างน้อย 70% ของอีกตำแหน่งหนึ่งในองค์กรอยู่แล้ว',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title leading-tight font-semibold">Workforce Dashboard</h1>
          <p className="mt-1 text-small text-haze">
            {scope === 'team'
              ? `ขอบเขตข้อมูล: ทีม ${session.managerDepartment} เท่านั้น ตามสิทธิ์ของบทบาท Manager`
              : 'ขอบเขตข้อมูล: ทั้งองค์กร'}
          </p>
        </div>
        <Badge tone="sky">ทุกตัวเลขคำนวณสดจาก scoring.ts</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : i * 0.045, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Tooltip content={<NumericText>{kpi.explain}</NumericText>} className="w-full">
              <Card className="w-full px-4 py-3.5 text-left" tone="flat">
                <p className="text-micro text-haze">{kpi.label}</p>
                <p
                  className={
                    kpi.tone === 'critical'
                      ? 'mt-1 text-critical'
                      : kpi.tone === 'warn'
                        ? 'mt-1 text-warn'
                        : 'mt-1 text-sky'
                  }
                >
                  <Num
                    value={kpi.value}
                    decimals={kpi.decimals}
                    suffix={kpi.suffix}
                    animate
                    className="text-display leading-none font-medium"
                  />
                </p>
              </Card>
            </Tooltip>
          </motion.div>
        ))}
      </div>

      <Card tone="flat" className="overflow-hidden">
        <CardHeader
          title="Skill Constellation"
          hint="คนหนึ่งคน = จุดหนึ่งจุด · มี skill ร่วมกันตั้งแต่ 3.0 จึงมีเส้นเชื่อม · กดที่จุดเพื่อเปิดโปรไฟล์"
          right={
            <Badge tone="muted">
              <span className="num">{employees.length}</span> คน
            </Badge>
          }
        />
        <div className="bg-gradient-to-b from-signal/[0.07] to-transparent px-3 pb-4">
          <SkillConstellation employees={employees} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-2">
          <CardHeader
            title="Skill Coverage by department"
            hint="สัดส่วน skill ที่งานต้องการ แล้วแผนกนั้นมีคนทำได้"
          />
          <div className="px-3 pb-4">
            <CoverageBarChart data={coverage} />
          </div>
        </Card>

        <Card tone="flat" className="lg:col-span-3">
          <CardHeader
            title="AI Insights"
            hint="สร้างจากข้อมูลจริงในระบบ กดดูที่มาได้ทุกข้อ"
            right={
              <Link to="/insights" className="text-small text-sky hover:underline">
                ดูทั้งหมด
              </Link>
            }
          />
          <ul className="space-y-2 px-5 pb-4">
            {insights.slice(0, 5).map((insight) => (
              <li
                key={insight.id}
                className="rounded-lg border border-line bg-panel-raised/60 px-3.5 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-small leading-relaxed">
                    <NumericText>{insight.title}</NumericText>
                  </p>
                  <Badge
                    tone={
                      insight.severity === 'critical'
                        ? 'critical'
                        : insight.severity === 'warn'
                          ? 'warn'
                          : 'sky'
                    }
                  >
                    {insight.kind}
                  </Badge>
                </div>
                <p className="mt-1 text-micro leading-relaxed text-haze">
                  <NumericText>{insight.computedFrom}</NumericText>
                </p>
              </li>
            ))}
            {insights.length === 0 ? (
              <li className="py-6 text-center text-small text-haze">
                ยังไม่มีข้อสังเกตในขอบเขตข้อมูลนี้
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  )
}
