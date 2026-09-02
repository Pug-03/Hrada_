import { useMemo, useState } from 'react'

import { SkillHistoryLineChart } from '@/components/charts/Charts'
import { EmployeePicker } from '@/components/EmployeePicker'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { Tooltip } from '@/components/ui/Tooltip'
import { HISTORY_MONTHS } from '@/data/employees'
import { skillName } from '@/data/skills'
import type { Employee, SkillId } from '@/data/types'
import { canViewPerformance, visibleEmployees, type Session } from '@/lib/permissions'
import {
  avgMonthlyGrowth,
  calcEngagementInDevelopmentPlan,
  calcManagerSatisfaction,
  calcPromotionReadiness,
  calcSkillCompletionRate,
  calcSkillGap,
  calcTimeToCompetency,
  calcWorkforceHealth,
  GROWTH_TREND_PER_MONTH,
  learningOutcomes,
  summariseTeam,
  targetRoleOf,
} from '@/lib/scoring'
import { seriesPalette } from '@/lib/theme'
import { useLearning } from '@/store/learning'
import { useSession } from '@/store/session'

type Mode = 'individual' | 'team'

/**
 * §11 Screen 7, carrying the full §10.11 KPI set. Where a metric genuinely
 * cannot be computed from this dataset — Time to Competency for a gap that is
 * still open — the screen says so instead of printing a number that would be
 * invented.
 */
export default function Tracking() {
  const session = useSession() as unknown as Session
  const employees = useMemo(() => visibleEmployees(session), [session])
  const [mode, setMode] = useState<Mode>(employees.length > 1 ? 'team' : 'individual')
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? '')
  const employee = employees.find((e) => e.id === selectedId) ?? employees[0]

  if (!employee) return <p className="text-small text-haze">ไม่มีข้อมูลในขอบเขตของบทบาทนี้</p>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title leading-tight font-semibold">Tracking</h1>
          <p className="mt-1 text-small text-haze">
            ติดตามการเติบโตของ skill ผลของการเรียน ผลงาน และเส้นทางอาชีพ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {employees.length > 1 ? (
            <div className="flex rounded-lg border border-line bg-panel p-0.5">
              {(['individual', 'team'] as Mode[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setMode(option)}
                  className={`rounded-md px-3 py-1.5 text-small transition-colors duration-150 ${
                    mode === option ? 'bg-signal/20 text-text' : 'text-haze hover:text-text'
                  }`}
                >
                  {option === 'individual' ? 'รายบุคคล' : 'ทั้งทีม'}
                </button>
              ))}
            </div>
          ) : null}
          {mode === 'individual' ? (
            <EmployeePicker employees={employees} value={employee.id} onChange={setSelectedId} />
          ) : null}
        </div>
      </div>

      {mode === 'individual' ? (
        <IndividualTracking employee={employee} session={session} />
      ) : (
        <TeamTracking employees={employees} />
      )}
    </div>
  )
}

function IndividualTracking({ employee, session }: { employee: Employee; session: Session }) {
  const completedByEmployee = useLearning((s) => s.completed)
  const startedByEmployee = useLearning((s) => s.started)

  const completion = calcSkillCompletionRate(employee, completedByEmployee[employee.id] ?? [])
  const engagement = calcEngagementInDevelopmentPlan(employee, startedByEmployee[employee.id] ?? [])
  const timeToCompetency = calcTimeToCompetency(employee)
  const satisfaction = calcManagerSatisfaction(employee)
  const readiness = calcPromotionReadiness(employee)
  const gap = calcSkillGap(employee, targetRoleOf(employee))
  const outcomes = learningOutcomes(employee)
  const growth = avgMonthlyGrowth(employee)

  const tracked = Object.keys(employee.skillHistory) as SkillId[]
  const palette = seriesPalette
  const chartData = HISTORY_MONTHS.map((month) => {
    const row: Record<string, number | string> = { month: month.slice(5) }
    for (const skillId of tracked) {
      const point = employee.skillHistory[skillId]?.find((p) => p.month === month)
      if (point) row[skillId] = point.level
    }
    return row
  })

  const managerReviews = employee.skills.flatMap((s) =>
    s.evidence.filter((e) => e.kind === 'Manager Review').map((e) => ({ ...e, skillId: s.skillId })),
  )
  const peerFeedback = employee.skills.flatMap((s) =>
    s.evidence.filter((e) => e.kind === 'Peer Feedback').map((e) => ({ ...e, skillId: s.skillId })),
  )
  const assessments = employee.skills.flatMap((s) =>
    s.evidence.filter((e) => e.kind === 'Assessment').map((e) => ({ ...e, skillId: s.skillId })),
  )

  return (
    <>
      <Card tone="flat">
        <CardHeader
          title="Skill Growth"
          hint={
            <>
              {employee.name} · <span className="num">6</span> เดือนล่าสุด · เติบโตเฉลี่ย{' '}
              <span className="num">+{growth.toFixed(2)}</span> ระดับต่อเดือน
            </>
          }
        />
        <div className="px-3 pb-4">
          <SkillHistoryLineChart
            data={chartData}
            series={tracked.map((skillId, i) => ({
              key: skillId,
              name: skillName(skillId),
              color: palette[i % palette.length],
            }))}
          />
        </div>
      </Card>

      <Card tone="flat">
        <CardHeader title="Learning Impact" hint="ตัวชี้วัดผลของการพัฒนา ตามชุด KPI ของ HRADA" />
        <div className="grid gap-3 px-5 pb-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Skill Completion Rate"
            value={completion.rate * 100}
            suffix="%"
            note={`ทำเสร็จ ${completion.completed} จาก ${completion.assigned} ขั้นใน Learning Path`}
          />
          <Kpi
            label="Employee Engagement in Development Plan"
            value={engagement.rate * 100}
            suffix="%"
            note={`เริ่มแล้ว ${engagement.started} จาก ${engagement.assigned} ขั้น — นับ "เริ่ม" ไม่ใช่ "จบ"`}
          />
          <div className="rounded-lg border border-line bg-panel-raised/50 px-3.5 py-3">
            <p className="text-micro text-haze">Time to Competency</p>
            {timeToCompetency.averageMonths === null ? (
              <>
                <p className="mt-1 text-section text-haze">ยังวัดไม่ได้</p>
                <p className="mt-1 text-micro leading-relaxed text-haze">
                  ยังไม่มี skill ไหนที่ประวัติ 6 เดือนวิ่งข้ามเกณฑ์ของตำแหน่งเป้าหมาย จึงยังไม่มีระยะเวลาให้วัด
                </p>
              </>
            ) : (
              <>
                <Num value={timeToCompetency.averageMonths} decimals={1} suffix=" เดือน" className="mt-1 text-section text-sky" />
                <p className="mt-1 text-micro leading-relaxed text-haze">
                  {timeToCompetency.perSkill
                    .map((r) => `${r.skillName} ${r.months} เดือน`)
                    .join(' · ')}
                </p>
              </>
            )}
          </div>
          <Tooltip content={<NumericText>{satisfaction.basis}</NumericText>}>
            <div className="w-full rounded-lg border border-line bg-panel-raised/50 px-3.5 py-3 text-left">
              <p className="text-micro text-haze">Manager Satisfaction</p>
              <Num value={satisfaction.score * 100} suffix="%" className="mt-1 text-section text-sky" />
              <p className="mt-1 text-micro leading-relaxed text-haze">
                ใช้ผลงานและ Manager Review <span className="num">{satisfaction.reviewCount}</span> รายการ
                เป็นตัวแทน — ยังไม่ใช่แบบสำรวจจริง
              </p>
            </div>
          </Tooltip>
        </div>

        <div className="border-t border-line/70 px-5 py-4">
          <p className="text-micro text-haze">Performance Improvement After Learning</p>
          <ul className="mt-2 space-y-1.5 text-small">
            {outcomes.length === 0 ? (
              <li className="text-haze">ยังไม่มีประวัติการเรียน</li>
            ) : (
              outcomes.map(({ record, outcome }) => (
                <li key={record.title} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    {record.title} <span className="text-haze">· {skillName(record.targetSkill)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num text-haze">
                      {outcome.before.toFixed(2)} → {outcome.after.toFixed(2)}
                    </span>
                    <Badge tone={outcome.lowOutcomeFlag ? 'warn' : 'sky'}>
                      {outcome.lowOutcomeFlag ? 'ยังไม่เห็นผล' : 'เห็นผล'} {outcome.delta >= 0 ? '+' : ''}
                      <span className="num">{outcome.delta.toFixed(2)}</span>
                    </Badge>
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card tone="flat">
          <CardHeader title="Performance" hint="ผลงาน หลักฐาน และเสียงจากคนรอบตัว" />
          <div className="space-y-4 px-5 pb-4">
            {canViewPerformance(session, employee.id) ? (
              <div className="flex items-baseline justify-between">
                <span className="text-small">KPI / ผลงานรวม</span>
                <Num value={employee.performance} decimals={1} suffix=" / 5.0" className="text-section text-sky" />
              </div>
            ) : null}

            <EvidenceList
              label="Project Outcome"
              items={employee.projects.map((p) => `${p.name} — ${p.role} (${p.year})`)}
            />
            <EvidenceList
              label="Manager Assessment"
              items={managerReviews.map((e) => `${skillName(e.skillId)}: ${e.detail} (${e.year})`)}
            />
            <EvidenceList
              label="Peer Feedback"
              items={peerFeedback.map((e) => `${skillName(e.skillId)}: ${e.detail} (${e.year})`)}
            />
            <EvidenceList
              label="Assessment"
              items={assessments.map((e) => `${skillName(e.skillId)}: ${e.detail} (${e.year})`)}
            />
          </div>
        </Card>

        <Card tone="flat">
          <CardHeader title="Career Development" hint="เป้าหมาย ความพร้อม และทางเลือกภายในองค์กร" />
          <div className="space-y-3 px-5 pb-4 text-small">
            <Row label="Career Goal" value={readiness.roleTitle} />
            <Row
              label="Promotion Readiness"
              value={
                <span className="num text-sky">
                  {(readiness.score * 100).toFixed(0)}%
                  {readiness.isHighPotential ? '' : ''}
                </span>
              }
            />
            <Row
              label="Skill Gap Reduction"
              value={
                <span className="num">
                  ผ่าน {gap.metCount}/{gap.requiredCount} ข้อ
                </span>
              }
            />
            <Row
              label="Internal Mobility"
              value={<InternalMobilityValue employeeId={employee.id} />}
            />
            <Row
              label="Role Changes"
              value={
                <span className="text-haze">
                  อยู่ตำแหน่งปัจจุบัน <span className="num">{employee.yearsInRole}</span> ปี จากประสบการณ์รวม{' '}
                  <span className="num">{employee.yearsExperience}</span> ปี
                </span>
              }
            />
            <div className="border-t border-line/70 pt-3">
              <p className="text-micro text-haze">ยังขาดสำหรับตำแหน่งเป้าหมาย</p>
              <ul className="mt-1.5 space-y-1">
                {readiness.missingSkills.length === 0 ? (
                  <li className="text-haze">ผ่านครบทุกข้อแล้ว</li>
                ) : (
                  readiness.missingSkills.map((item) => (
                    <li key={item.skillId} className="flex justify-between gap-3">
                      <span>{item.skillName}</span>
                      <span className="num text-warn">
                        {item.current.toFixed(1)} / {item.required.toFixed(1)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

function InternalMobilityValue({ employeeId }: { employeeId: string }) {
  const health = calcWorkforceHealth()
  const option = health.internalMobility.find((m) => m.employee.id === employeeId)
  if (!option) return <span className="text-haze">ยังไม่ผ่านเกณฑ์ 70% ของตำแหน่งอื่น</span>
  return (
    <span>
      {option.role.title} <span className="num text-sky">{Math.round(option.pctMet * 100)}%</span>
    </span>
  )
}

function TeamTracking({ employees }: { employees: Employee[] }) {
  const completed = useLearning((s) => s.completed)
  const started = useLearning((s) => s.started)
  const rollup = summariseTeam(employees, { completed, started })

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Skill Coverage"
          value={rollup.skillCoverage * 100}
          suffix="%"
          note={`${rollup.coveredCount} จาก ${rollup.demandCount} skill ที่งานต้องการ`}
        />
        <Kpi
          label="Promotion Readiness เฉลี่ย"
          value={rollup.averageReadiness * 100}
          suffix="%"
          note={`High Potential ${rollup.highPotentialCount} คน`}
        />
        <Kpi
          label="Skill Completion Rate เฉลี่ย"
          value={rollup.averageCompletionRate * 100}
          suffix="%"
          note="เฉลี่ยจาก Learning Path ของทุกคนในขอบเขตนี้"
        />
        <Kpi
          label="Internal Mobility Rate"
          value={rollup.internalMobilityRate * 100}
          suffix="%"
          note={`${rollup.mobileCount} คนผ่านเกณฑ์ 70% ของอีกตำแหน่ง`}
        />
      </div>

      <Card tone="flat">
        <CardHeader title="รายคน" hint="เรียงตาม Promotion Readiness" />
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full min-w-180 text-left text-small">
            <thead>
              <tr className="text-micro text-haze">
                <th className="pb-2 font-normal">ชื่อ</th>
                <th className="pb-2 font-normal">Promotion Readiness</th>
                <th className="pb-2 font-normal">เติบโต/เดือน</th>
                <th className="pb-2 font-normal">Skill Completion</th>
                <th className="pb-2 font-normal">Engagement</th>
                <th className="pb-2 font-normal">Workload</th>
                <th className="pb-2 font-normal">การเรียนที่ยังไม่เห็นผล</th>
              </tr>
            </thead>
            <tbody>
              {rollup.rows.map((row) => (
                <tr key={row.employee.id} className="border-t border-line/60">
                  <td className="py-2 pr-3">
                    {row.employee.name}
                    <span className="block text-micro text-haze">{row.employee.title}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="num text-sky">{(row.readiness.score * 100).toFixed(0)}%</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`num ${row.growth >= GROWTH_TREND_PER_MONTH ? 'text-sky' : 'text-haze'}`}>
                      +{row.growth.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="num">{(row.completion.rate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="num">{(row.engagement.rate * 100).toFixed(0)}%</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`num ${row.employee.workload > 85 ? 'text-warn' : ''}`}>
                      {row.employee.workload}%
                    </span>
                  </td>
                  <td className="py-2">
                    {row.lowOutcomeCount > 0 ? (
                      <Badge tone="warn">
                        <span className="num">{row.lowOutcomeCount}</span> รายการ
                      </Badge>
                    ) : (
                      <span className="text-haze">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function Kpi({
  label,
  value,
  suffix,
  note,
}: {
  label: string
  value: number
  suffix?: string
  note: string
}) {
  return (
    <div className="rounded-lg border border-line bg-panel-raised/50 px-3.5 py-3">
      <p className="text-micro text-haze">{label}</p>
      <Num value={value} decimals={0} suffix={suffix} className="mt-1 text-section text-sky" />
      <p className="mt-1 text-micro leading-relaxed text-haze">
        <NumericText>{note}</NumericText>
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-haze">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function EvidenceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-micro text-haze">{label}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-small text-haze">ยังไม่มีข้อมูลบันทึกไว้</p>
      ) : (
        <ul className="mt-1 space-y-1 text-small">
          {items.map((item) => (
            <li key={item} className="leading-relaxed">
              · {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
