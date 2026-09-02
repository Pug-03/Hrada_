import { motion, useReducedMotion } from 'framer-motion'
import { Check, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmployeePicker } from '@/components/EmployeePicker'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { LevelBar } from '@/components/ui/LevelBar'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { skillName } from '@/data/skills'
import { visibleEmployees, type Session } from '@/lib/permissions'
import {
  calcEngagementInDevelopmentPlan,
  calcSkillCompletionRate,
  calcSkillGap,
  generateLearningPath,
  learningOutcomes,
  peakSkillLevel,
  targetRoleOf,
} from '@/lib/scoring'
import { useLearning } from '@/store/learning'
import { useSession } from '@/store/session'

/**
 * §11 Screen 6. The path always ends with real project work and a manager
 * reassessment, and the screen explains why: Nicha's two completed courses on
 * this very screen moved her Client Handling by 0.1 (§9.4 case 6), which is
 * the argument for learning in the flow of work in one concrete number.
 */
export default function Learning() {
  const session = useSession() as unknown as Session
  const reduced = useReducedMotion()
  const employees = useMemo(() => visibleEmployees(session), [session])
  const [selectedId, setSelectedId] = useState(employees[0]?.id ?? '')

  const employee = employees.find((e) => e.id === selectedId) ?? employees[0]

  const completedByEmployee = useLearning((s) => s.completed)
  const startedByEmployee = useLearning((s) => s.started)
  const toggleCompleted = useLearning((s) => s.toggleCompleted)
  const toggleStarted = useLearning((s) => s.toggleStarted)

  const path = useMemo(() => (employee ? generateLearningPath(employee) : null), [employee])
  const gap = useMemo(
    () => (employee ? calcSkillGap(employee, targetRoleOf(employee)) : null),
    [employee],
  )
  const outcomes = useMemo(() => (employee ? learningOutcomes(employee) : []), [employee])

  if (!employee || !path || !gap) {
    return <p className="text-small text-haze">ไม่มีข้อมูลพนักงานในขอบเขตของบทบาทนี้</p>
  }

  const completed = completedByEmployee[employee.id] ?? []
  const started = startedByEmployee[employee.id] ?? []
  const completion = calcSkillCompletionRate(employee, completed)
  const engagement = calcEngagementInDevelopmentPlan(employee, started)
  const role = targetRoleOf(employee)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title leading-tight font-semibold">Personalized Learning</h1>
          <p className="mt-1 text-small text-haze">
            เส้นทางพัฒนาสร้างจาก Skill Gap จริงของแต่ละคน ไม่ใช่คอร์สแนะนำทั่วไป
          </p>
        </div>
        <EmployeePicker employees={employees} value={employee.id} onChange={setSelectedId} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card tone="flat" className="px-4 py-3.5">
          <p className="text-micro text-haze">Current Skills</p>
          <Num value={employee.skills.length} className="text-title text-sky" />
          <p className="mt-1 text-micro text-haze">
            สูงสุด{' '}
            <span className="num">
              {peakSkillLevel(employee).toFixed(1)}
            </span>
          </p>
        </Card>
        <Card tone="flat" className="px-4 py-3.5">
          <p className="text-micro text-haze">Primary Skill Gap</p>
          <p className="mt-0.5 text-body">{path.targetSkillName ?? 'ไม่มี'}</p>
          {path.targetSkill ? (
            <p className="mt-1 text-micro text-warn">
              <span className="num">{path.fromLevel.toFixed(1)}</span> →{' '}
              <span className="num">{path.toLevel.toFixed(1)}</span>
            </p>
          ) : null}
        </Card>
        <Card tone="flat" className="px-4 py-3.5">
          <p className="text-micro text-haze">Target Role</p>
          <p className="mt-0.5 text-body">{role.title}</p>
          <p className="mt-1 text-micro text-haze">
            ผ่านแล้ว <span className="num">{gap.metCount}</span>/
            <span className="num">{gap.requiredCount}</span> skill
          </p>
        </Card>
        <Card tone="flat" className="px-4 py-3.5">
          <p className="text-micro text-haze">Skill Completion Rate</p>
          <Num value={completion.rate * 100} suffix="%" className="text-title text-sky" />
          <p className="mt-1 text-micro text-haze">
            ทำแล้ว <span className="num">{completion.completed}</span>/
            <span className="num">{completion.assigned}</span> ขั้น · เริ่มแล้ว{' '}
            <span className="num">{engagement.started}</span>
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-3">
          <CardHeader
            title="Learning Path"
            hint={path.method}
            right={
              <span className="text-micro text-haze">
                <span className="num">{completion.completed}</span>/
                <span className="num">{completion.assigned}</span>
              </span>
            }
          />
          <div className="px-5 pb-4">
            <div className="h-1.5 w-full rounded-full bg-line/70">
              <motion.div
                className="h-full rounded-full bg-sky"
                animate={{ width: `${completion.rate * 100}%` }}
                transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {path.steps.length === 0 ? (
              <p className="mt-4 text-small text-haze">
                {employee.name} ผ่านเกณฑ์ skill ครบทุกข้อของ {role.title} แล้ว —
                ขั้นถัดไปคือคุยกับหัวหน้าเรื่องขอบเขตงานใหม่ ไม่ใช่คอร์สเพิ่ม
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {path.steps.map((step, index) => {
                  const isDone = completed.includes(step.id)
                  const isStarted = started.includes(step.id)
                  return (
                    <li key={step.id}>
                      <div
                        className={`rounded-lg border px-3.5 py-3 transition-colors duration-150 ${
                          isDone ? 'border-sky/40 bg-sky/[0.06]' : 'border-line bg-panel-raised/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleCompleted(employee.id, step.id)}
                            aria-pressed={isDone}
                            aria-label={`ทำเครื่องหมายว่าเรียน ${step.title} เสร็จแล้ว`}
                            className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-150 ${
                              isDone ? 'border-sky bg-sky text-ink' : 'border-line hover:border-haze'
                            }`}
                          >
                            <motion.span
                              initial={false}
                              animate={isDone ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
                              transition={
                                reduced
                                  ? { duration: 0.12 }
                                  : { type: 'spring', stiffness: 520, damping: 16 }
                              }
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-small">
                                <span className="num mr-2 text-haze">{index + 1}</span>
                                {step.title}
                              </p>
                              <span className="flex items-center gap-2">
                                <Badge tone={step.synthesized ? 'sky' : 'muted'}>{step.type}</Badge>
                                <span className="num text-micro text-haze">{step.durationHours} ชม.</span>
                              </span>
                            </div>
                            <p className="mt-1 text-micro leading-relaxed text-haze">
                              <NumericText>{step.rationale}</NumericText>
                            </p>
                            {!isDone ? (
                              <button
                                onClick={() => toggleStarted(employee.id, step.id)}
                                className="mt-2 text-micro text-haze underline-offset-2 hover:text-sky hover:underline"
                              >
                                {isStarted ? 'ยกเลิกว่าเริ่มแล้ว' : 'ทำเครื่องหมายว่าเริ่มแล้ว'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card tone="flat">
            <CardHeader title="Skill Gap ทั้งหมด" hint={`เทียบกับ ${role.title}`} />
            <ul className="space-y-3 px-5 pb-4">
              {gap.gaps.map((item) => (
                <li key={item.skillId}>
                  <div className="flex items-baseline justify-between gap-3 text-small">
                    <span className={item.gap > 0 ? '' : 'text-haze'}>{item.skillName}</span>
                    <span className="num">
                      <span className={item.gap > 0 ? 'text-warn' : 'text-sky'}>{item.current.toFixed(1)}</span>
                      <span className="text-haze"> / {item.required.toFixed(1)}</span>
                    </span>
                  </div>
                  <LevelBar level={item.current} required={item.required} className="mt-1.5" />
                </li>
              ))}
            </ul>
          </Card>

          <Card tone="flat">
            <CardHeader title="Learning Outcome" hint="สิ่งที่เรียนไปแล้ว ขยับระดับจริงเท่าไร" />
            <div className="space-y-3 px-5 pb-4">
              {outcomes.length === 0 ? (
                <p className="text-small text-haze">ยังไม่มีประวัติการเรียนที่บันทึกไว้</p>
              ) : (
                outcomes.map(({ record, outcome }) => (
                  <div
                    key={record.title}
                    className={`rounded-lg border px-3.5 py-3 ${
                      outcome.lowOutcomeFlag ? 'border-warn/40 bg-warn/[0.07]' : 'border-line bg-panel-raised/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-small">{record.title}</p>
                      <Badge tone="muted">{record.type}</Badge>
                    </div>
                    <p className="mt-1 text-micro text-haze">
                      {skillName(record.targetSkill)} · จบเมื่อ <span className="num">{record.completedOn}</span>
                    </p>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="num text-micro text-haze">{outcome.before.toFixed(2)}</span>
                      <div className="relative h-1.5 flex-1 rounded-full bg-line/70">
                        <motion.div
                          className={`absolute inset-y-0 left-0 rounded-full ${
                            outcome.lowOutcomeFlag ? 'bg-warn' : 'bg-sky'
                          }`}
                          initial={reduced ? false : { width: `${(outcome.before / 5) * 100}%` }}
                          animate={{ width: `${(outcome.after / 5) * 100}%` }}
                          transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span
                        className={`num text-micro ${outcome.lowOutcomeFlag ? 'text-warn' : 'text-sky'}`}
                      >
                        {outcome.after.toFixed(2)}
                      </span>
                    </div>

                    {outcome.lowOutcomeFlag ? (
                      <p className="mt-2 flex items-start gap-1.5 text-micro leading-relaxed text-warn">
                        <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                        <NumericText>{outcome.message}</NumericText>
                      </p>
                    ) : (
                      <p className="mt-2 text-micro text-haze">
                        <NumericText>{outcome.message}</NumericText>
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
