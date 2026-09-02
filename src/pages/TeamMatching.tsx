import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Minus, Plus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { AnalysisLoader } from '@/components/ui/AnalysisLoader'
import { useAnalysis } from '@/hooks/useAnalysis'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ScoreBreakdown } from '@/components/ui/Explain'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { EMPLOYEES } from '@/data/employees'
import { getProject, PROJECTS } from '@/data/projects'
import { skillName } from '@/data/skills'
import { canViewEmployee, type Session } from '@/lib/permissions'
import { requirementCovered, selectTeam, type TeamMember } from '@/lib/scoring'
import { motion as motionTokens, talentColor } from '@/lib/theme'
import { useSession } from '@/store/session'

/**
 * §11 Screen 5. The team is assembled by greedy coverage (§10.4), not by
 * taking the highest scores, and the screen says so: each card states which
 * open requirement that person was picked to close.
 *
 * Proposals draw on the whole company — finding someone in another department
 * is the point of the product — while a Manager can still only open the full
 * profile of their own team (§8).
 */
export default function TeamMatching() {
  const session = useSession() as unknown as Session
  const reduced = useReducedMotion()
  const [projectId, setProjectId] = useState(PROJECTS[0].id)
  const project = getProject(projectId)
  const [teamSize, setTeamSize] = useState(project.teamSize)
  const [explaining, setExplaining] = useState<TeamMember | null>(null)
  const { running, run } = useAnalysis(880)

  const team = useMemo(
    () => selectTeam(project, EMPLOYEES, teamSize),
    [project, teamSize],
  )

  useEffect(() => {
    setTeamSize(getProject(projectId).teamSize)
    run()
    // Keyed on the project alone, for the same reason as Recruit: `run` is a
    // fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold">AI Team Matching</h1>
        <p className="mt-1 text-[13px] text-haze">
          จัดทีมด้วยวิธี greedy coverage — เลือกคนที่ปิด skill ที่ยังขาดได้มากที่สุดก่อน ไม่ใช่เรียงจากคะแนนสูงสุด
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROJECTS.map((option) => (
          <button
            key={option.id}
            onClick={() => setProjectId(option.id)}
            className={`rounded-lg border px-3.5 py-2 text-left text-[13px] transition-[background-color,transform] duration-150 hover:-translate-y-0.5 ${
              option.id === projectId
                ? 'border-signal/60 bg-signal/15'
                : 'border-line bg-panel hover:bg-panel-raised'
            }`}
          >
            <span className="block">{option.name}</span>
            <span className="block text-[11px] text-haze">
              ต้องการ <span className="num">{option.teamSize}</span> คน ·{' '}
              <span className="num">{option.durationMonths}</span> เดือน
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-2">
          <CardHeader title={project.name} hint={project.description} />
          <div className="px-5 pb-4">
            <p className="text-[11px] text-haze">Required skills</p>
            <ul className="mt-1.5 space-y-1 text-[13px]">
              {project.requiredSkills.map((req) => {
                const covered = requirementCovered(team.members, req.skillId, req.level)
                return (
                  <li key={req.skillId} className="flex items-center justify-between gap-3">
                    <span>{skillName(req.skillId)}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-haze">{req.level.toFixed(1)}</span>
                      <Badge tone={covered ? 'sky' : 'warn'}>{covered ? 'มีคนรับผิดชอบ' : 'ยังขาด'}</Badge>
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-5 border-t border-line/70 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px]">ขนาดทีม</span>
                <span className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    aria-label="ลดขนาดทีม"
                    onClick={() => setTeamSize((n) => Math.max(2, n - 1))}
                    disabled={teamSize <= 2}
                    className="px-2 py-1"
                  >
                    <Minus size={13} />
                  </Button>
                  <Num value={teamSize} className="w-6 text-center text-[20px] text-sky" />
                  <Button
                    variant="secondary"
                    aria-label="เพิ่มขนาดทีม"
                    onClick={() => setTeamSize((n) => Math.min(6, n + 1))}
                    disabled={teamSize >= 6}
                    className="px-2 py-1"
                  >
                    <Plus size={13} />
                  </Button>
                </span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-haze">
                <NumericText>
                  เปลี่ยนขนาดทีมแล้วระบบคำนวณใหม่ทันที — ทีมตั้งแต่ 4 คนขึ้นไปต้องมี Developing Talent อย่างน้อย 1 คน
                  เพื่อให้โครงการสร้างคนไปด้วย
                </NumericText>
              </p>
            </div>

            <div className="mt-5 border-t border-line/70 pt-4">
              <p className="text-[11px] text-haze">ขั้นตอนที่ระบบใช้เลือก</p>
              <ol className="mt-1.5 space-y-1.5 text-[11px] leading-relaxed text-haze">
                {team.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="num shrink-0 text-sky">{i + 1}</span>
                    <span>
                      <NumericText>{step}</NumericText>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          {running ? (
            <AnalysisLoader
              message={`กำลังวิเคราะห์ Skill Graph ของพนักงาน ${EMPLOYEES.length} คน เทียบกับ ${project.requiredSkills.length} required skills`}
              rows={teamSize}
            />
          ) : (
            <>
              {team.developingTalentSwap ? (
                <Card tone="quiet" className="border-sky/30 px-4 py-3">
                  <p className="text-[11px] leading-relaxed text-sky">
                    <NumericText>{team.developingTalentSwap.reason}</NumericText>
                  </p>
                </Card>
              ) : null}

              <ul className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {team.members.map((member) => (
                    <motion.li
                      key={member.employee.id}
                      layout={!reduced}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                      transition={reduced ? { duration: 0.12 } : motionTokens.reorder}
                    >
                      <Card tone="flat" className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold">
                              {canViewEmployee(session, member.employee.id) ? (
                                <Link to={`/employees/${member.employee.id}`} className="hover:text-sky">
                                  {member.employee.name}
                                </Link>
                              ) : (
                                member.employee.name
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-haze">
                              {member.employee.title} · {member.employee.department}
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <Badge
                              tone="muted"
                              className="mt-1"
                              // Talent type is the one place a non-palette hue appears,
                              // and it is meaning, not decoration.
                            >
                              <span style={{ color: member.talent.qualified ? talentColor[member.talent.type] : undefined }}>
                                {member.talent.qualified ? member.talent.type : 'ยังไม่จัดกลุ่ม'}
                              </span>
                            </Badge>
                            <div className="text-right">
                              <p className="text-[11px] text-haze">Fit</p>
                              <Num value={member.fit.total} decimals={1} suffix="%" className="text-[20px] text-sky" />
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-haze">
                          <NumericText>{member.reason}</NumericText>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {member.fit.brings.map((s) => (
                            <Badge key={s.skillId} tone="sky">
                              {s.skillName} <span className="num">{s.current.toFixed(1)}</span>
                            </Badge>
                          ))}
                          <Badge tone={member.employee.workload > 85 ? 'warn' : 'muted'}>
                            Workload <span className="num">{member.employee.workload}%</span>
                          </Badge>
                        </div>

                        {member.workloadRisk ? (
                          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" />
                            <p className="text-[11px] leading-relaxed text-warn">
                              Workload Risk — {member.employee.name} รับงานอยู่{' '}
                              <span className="num">{member.employee.workload}%</span> แล้ว
                              {member.backupName ? (
                                <>
                                  {' '}
                                  ถ้าต้องกระจายงาน คนที่เหมาะรับแทนคือ {member.backupName}
                                </>
                              ) : null}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-3">
                          <Button variant="ghost" onClick={() => setExplaining(member)}>
                            ทำไมถึงเลือกคนนี้?
                          </Button>
                        </div>
                      </Card>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {team.teamGaps.length > 0 ? (
                <Card tone="flat" className="border-warn/40 p-4">
                  <div className="flex items-start gap-2">
                    <Users size={15} className="mt-0.5 shrink-0 text-warn" />
                    <div>
                      <p className="text-[13px] text-warn">ทีมนี้ยังปิดไม่ครบ</p>
                      <ul className="mt-1.5 space-y-1 text-[11px] text-haze">
                        {team.teamGaps.map((gap) => (
                          <li key={gap.skillId}>
                            {gap.skillName}: คนที่เก่งที่สุดในทีมอยู่ที่{' '}
                            <span className="num">{gap.current.toFixed(1)}</span> โครงการต้องการ{' '}
                            <span className="num">{gap.required.toFixed(1)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] leading-relaxed text-haze">
                        เลือกได้สองทาง — พัฒนาคนในทีมผ่าน Learning Path หรือเปิดรับคนใหม่
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link to="/recruit">
                          <Button variant="primary">เปิดรับตำแหน่งสำหรับ skill ที่ขาด</Button>
                        </Link>
                        <Link to="/learning">
                          <Button variant="secondary">ดู Learning Path ของคนในทีม</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card tone="quiet" className="px-4 py-3">
                  <p className="text-[11px] text-sky">
                    ทีมนี้ครอบคลุม required skills ครบทุกข้อจากคนที่มีอยู่แล้ว ไม่ต้องเปิดรับเพิ่ม
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <SlidePanel
        open={explaining !== null}
        onClose={() => setExplaining(null)}
        title="ทำไมถึงเลือกคนนี้?"
        subtitle={explaining ? `${explaining.employee.name} → ${project.name}` : undefined}
      >
        {explaining ? (
          <>
            <ScoreBreakdown components={explaining.fit.components} total={explaining.fit.total} totalLabel="Team Fit" />
            <div className="mt-5 rounded-lg border border-line bg-panel-raised/60 p-3.5">
              <p className="text-[11px] text-haze">เหตุผลที่ถูกเลือกในลำดับนี้</p>
              <p className="mt-1 text-[13px] leading-relaxed">
                <NumericText>{explaining.reason}</NumericText>
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-panel-raised/60 p-3.5">
              <p className="text-[11px] text-haze">Talent Classification</p>
              <p className="mt-1 text-[13px] leading-relaxed">
                <NumericText>{explaining.talent.reason}</NumericText>
              </p>
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-haze">
              รายชื่อนี้เป็นข้อเสนอ ไม่ใช่การมอบหมายงาน — หัวหน้าโครงการเป็นผู้ตัดสินใจว่าจะจัดทีมแบบใด
            </p>
          </>
        ) : null}
      </SlidePanel>
    </div>
  )
}
