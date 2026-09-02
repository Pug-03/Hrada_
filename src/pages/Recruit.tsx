import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, CalendarCheck, ThumbsDown, ThumbsUp, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { AnalysisLoader } from '@/components/ui/AnalysisLoader'
import { useAnalysis } from '@/hooks/useAnalysis'
import { ScoreBreakdown } from '@/components/ui/Explain'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { getJob, JOBS } from '@/data/jobs'
import { skillName } from '@/data/skills'
import type { Candidate } from '@/data/types'
import { canViewSalary, type Session } from '@/lib/permissions'
import { rankCandidates, type CandidateMatchResult } from '@/lib/scoring'
import { motion as motionTokens } from '@/lib/theme'
import { useDecisions, type CandidateDecision } from '@/store/decisions'
import { useToast } from '@/store/toast'
import { useSession } from '@/store/session'

/**
 * §11 Screen 4. Two rules shape this screen:
 *   — the critical-gap warning is shown separately from the score, because the
 *     top scorer here is exactly the person carrying one (§9.6a);
 *   — no button rejects anybody automatically (§12). Pass / Reject / Schedule
 *     Interview are all recorded as a human's decision, and all reversible.
 */
const DECISION_COPY: Record<CandidateDecision, { label: string; toast: string }> = {
  interview: { label: 'นัดสัมภาษณ์', toast: 'นัดสัมภาษณ์แล้ว' },
  pass: { label: 'ผ่านเข้ารอบถัดไป', toast: 'บันทึกว่าผ่านเข้ารอบถัดไปแล้ว' },
  reject: { label: 'ไม่ไปต่อ', toast: 'บันทึกว่าไม่ไปต่อแล้ว' },
}

export default function Recruit() {
  const session = useSession() as unknown as Session
  const reduced = useReducedMotion()
  const [jobId, setJobId] = useState(JOBS[0].id)
  const [explaining, setExplaining] = useState<{ candidate: Candidate; match: CandidateMatchResult } | null>(null)
  const { running, run } = useAnalysis(820)
  const decisions = useDecisions((s) => s.decisions)
  const decide = useDecisions((s) => s.decide)
  const undo = useDecisions((s) => s.undo)
  const pushToast = useToast((s) => s.push)

  const job = getJob(jobId)
  const ranked = useMemo(() => rankCandidates(job), [job])

  // Re-run the analysis state whenever the job changes, so the screen shows
  // the work being done rather than swapping lists instantly.
  useEffect(() => {
    run()
    // Intentionally keyed on the job alone: `run` is recreated every render,
    // so listing it here would restart the analysis in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  const onDecide = (candidate: Candidate, decision: CandidateDecision) => {
    decide(candidate.id, decision)
    pushToast(`${DECISION_COPY[decision].toast} — ${candidate.name}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-title leading-tight font-semibold">AI Recruit</h1>
        <p className="mt-1 text-small text-haze">
          จัดอันดับผู้สมัครจาก Match Score พร้อมคำอธิบายทุกคะแนน — ระบบไม่ตัดใครออกเอง
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {JOBS.map((option) => (
          <button
            key={option.id}
            onClick={() => setJobId(option.id)}
            className={`rounded-lg border px-3.5 py-2 text-left text-small transition-[background-color,transform] duration-150 hover:-translate-y-0.5 ${
              option.id === jobId
                ? 'border-signal/60 bg-signal/15'
                : 'border-line bg-panel hover:bg-panel-raised'
            }`}
          >
            <span className="block">{option.title}</span>
            <span className="block text-micro text-haze">{option.department}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-2">
          <CardHeader title={job.title} hint={job.description} />
          <div className="space-y-3 px-5 pb-4 text-small">
            <Requirement label="Required" items={job.requiredSkills} />
            <Requirement label="Preferred" items={job.preferredSkills} />
            <div className="flex justify-between border-t border-line/70 pt-3 text-haze">
              <span>ประสบการณ์ขั้นต่ำ</span>
              <span className="num text-text">{job.minExperience} ปี</span>
            </div>
            <div className="flex justify-between text-haze">
              <span>รูปแบบงาน</span>
              <span className="text-text">
                {job.employmentType} · <NumericText>{job.location}</NumericText>
              </span>
            </div>
            {canViewSalary(session) ? (
              <div className="flex justify-between text-haze">
                <span>Salary Range</span>
                <span className="num text-text">
                  {job.salaryRange.min.toLocaleString()}–{job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
                </span>
              </div>
            ) : null}
            <div className="border-t border-line/70 pt-3">
              <p className="text-micro text-haze">ความรับผิดชอบ</p>
              <ul className="mt-1.5 space-y-1 text-haze">
                {job.responsibilities.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {running ? (
            <AnalysisLoader
              message={`กำลังวิเคราะห์ผู้สมัคร ${ranked.length} คน เทียบกับ ${job.requiredSkills.length} required skills ของ ${job.title}`}
              rows={ranked.length}
            />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {ranked.map(({ candidate, match }, index) => {
                  const decision = decisions[candidate.id]
                  return (
                    <motion.li
                      key={candidate.id}
                      layout={!reduced}
                      transition={reduced ? { duration: 0.12 } : motionTokens.reorder}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card tone="flat" className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-body font-semibold">
                              <span className="num mr-2 text-haze">#{index + 1}</span>
                              {candidate.name}
                            </p>
                            <p className="mt-0.5 text-micro text-haze">
                              {candidate.education} · ประสบการณ์{' '}
                              <span className="num">{candidate.yearsExperience}</span> ปี · Assessment{' '}
                              <span className="num">{candidate.assessmentScore}</span>/100
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-micro text-haze">Match Score</p>
                            <Num value={match.total} decimals={1} className="text-title leading-none text-sky" />
                          </div>
                        </div>

                        {match.hasCriticalGap ? (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-critical/40 bg-critical/10 px-3 py-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-critical" />
                            <p className="text-micro leading-relaxed text-critical">
                              คะแนนรวมสูง แต่ยังขาด skill สำคัญเกิน <span className="num">1.0</span> ระดับ:{' '}
                              {match.criticalGaps.map((g, i) => (
                                <span key={g.skillId}>
                                  {i > 0 ? ' · ' : ''}
                                  {g.skillName} <span className="num">{g.current.toFixed(1)}</span> จากที่ต้องการ{' '}
                                  <span className="num">{g.required.toFixed(1)}</span>
                                </span>
                              ))}
                              . ข้อนี้แยกจากคะแนนโดยตั้งใจ เพราะคะแนนเฉลี่ยกลบเรื่องนี้ได้
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {match.strengths.slice(0, 3).map((s) => (
                            <Badge key={s.skillId} tone="sky">
                              {s.skillName} <span className="num">{s.current.toFixed(1)}</span>
                            </Badge>
                          ))}
                          {match.requiredGaps.map((s) => (
                            <Badge key={s.skillId} tone="warn">
                              {s.skillName} ขาด <span className="num">{s.gap.toFixed(1)}</span>
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button variant="ghost" onClick={() => setExplaining({ candidate, match })}>
                            Why this match?
                          </Button>
                          <div className="ml-auto flex flex-wrap gap-2">
                            {decision ? (
                              <>
                                <Badge tone={decision === 'reject' ? 'critical' : 'sky'}>
                                  {DECISION_COPY[decision].toast}
                                </Badge>
                                <Button variant="ghost" icon={<Undo2 size={14} />} onClick={() => undo(candidate.id)}>
                                  ยกเลิกการตัดสินใจ
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="primary"
                                  icon={<CalendarCheck size={14} />}
                                  onClick={() => onDecide(candidate, 'interview')}
                                >
                                  {DECISION_COPY.interview.label}
                                </Button>
                                <Button icon={<ThumbsUp size={14} />} onClick={() => onDecide(candidate, 'pass')}>
                                  {DECISION_COPY.pass.label}
                                </Button>
                                <Button
                                  variant="danger"
                                  icon={<ThumbsDown size={14} />}
                                  onClick={() => onDecide(candidate, 'reject')}
                                >
                                  {DECISION_COPY.reject.label}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
          <p className="mt-3 text-micro leading-relaxed text-haze">
            ผู้สมัครที่คะแนนต่ำยังคงอยู่ในรายการพร้อมปุ่มตัดสินใจเสมอ — HRADA ไม่ตัดใครออกโดยอัตโนมัติ
          </p>
        </div>
      </div>

      <SlidePanel
        open={explaining !== null}
        onClose={() => setExplaining(null)}
        title="Why this match?"
        subtitle={explaining ? `${explaining.candidate.name} → ${job.title}` : undefined}
      >
        {explaining ? (
          <>
            <ScoreBreakdown
              components={explaining.match.components}
              total={explaining.match.total}
              totalLabel="Match Score"
            />

            {explaining.match.hasCriticalGap ? (
              <div className="mt-5 rounded-lg border border-critical/40 bg-critical/10 p-3.5">
                <p className="text-small text-critical">Critical gap</p>
                <ul className="mt-2 space-y-1 text-micro text-critical/90">
                  {explaining.match.criticalGaps.map((g) => (
                    <li key={g.skillId}>
                      {g.skillName}: มี <span className="num">{g.current.toFixed(1)}</span> ตำแหน่งต้องการ{' '}
                      <span className="num">{g.required.toFixed(1)}</span> (ห่าง{' '}
                      <span className="num">{g.gap.toFixed(1)}</span> ระดับ)
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-micro text-haze">จุดแข็งที่ตรงกับตำแหน่ง</p>
              <ul className="mt-1.5 space-y-1 text-small">
                {explaining.match.strengths.length === 0 ? (
                  <li className="text-haze">ยังไม่มี required skill ข้อไหนที่ถึงเกณฑ์</li>
                ) : (
                  explaining.match.strengths.map((s) => (
                    <li key={s.skillId} className="flex justify-between gap-3">
                      <span>{s.skillName}</span>
                      <span className="num text-sky">{s.current.toFixed(1)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="mt-5">
              <p className="text-micro text-haze">Skill Gap</p>
              <ul className="mt-1.5 space-y-1 text-small">
                {explaining.match.requiredGaps.length === 0 ? (
                  <li className="text-haze">ผ่านเกณฑ์ required skills ครบทุกข้อ</li>
                ) : (
                  explaining.match.requiredGaps.map((s) => (
                    <li key={s.skillId} className="flex justify-between gap-3">
                      <span>{s.skillName}</span>
                      <span className="num text-warn">
                        {s.current.toFixed(1)} / {s.required.toFixed(1)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="mt-5">
              <p className="text-micro text-haze">ข้อมูลประกอบ</p>
              <ul className="mt-1.5 space-y-1 text-small text-haze">
                <li>Certifications: {explaining.candidate.certifications.join(', ') || 'ไม่มี'}</li>
                <li>โครงการ: {explaining.candidate.projects.map((p) => p.name).join(', ')}</li>
                {explaining.candidate.portfolio ? <li>Portfolio: {explaining.candidate.portfolio}</li> : null}
              </ul>
            </div>

            <p className="mt-5 text-micro leading-relaxed text-haze">
              คะแนนนี้เป็นข้อมูลประกอบการตัดสินใจของ HR เท่านั้น การตัดสินใจรับหรือไม่รับเป็นของคน
            </p>
          </>
        ) : null}
      </SlidePanel>
    </div>
  )
}

function Requirement({
  label,
  items,
}: {
  label: string
  items: { skillId: import('@/data/types').SkillId; level: number }[]
}) {
  if (items.length === 0) return null
  return (
    <div>
      <p className="text-micro text-haze">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item.skillId} className="flex justify-between gap-3">
            <span>{skillName(item.skillId)}</span>
            <span className="num text-haze">{item.level.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
