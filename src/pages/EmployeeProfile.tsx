import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { SkillHistoryLineChart, SkillRadarChart } from '@/components/charts/Charts'
import type { DeniedState } from '@/components/DeniedState'
import { SkillLevelLegend } from '@/components/SkillLevelLegend'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { LevelBar } from '@/components/ui/LevelBar'
import { NumericText } from '@/components/ui/NumericText'
import { Num } from '@/components/ui/Num'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ScoreBreakdown } from '@/components/ui/Explain'
import { WorkloadBreakdown } from '@/components/ui/WorkloadBreakdown'
import { EMPLOYEES, HISTORY_MONTHS } from '@/data/employees'
import { bandFor, skillName } from '@/data/skills'
import type { SkillId } from '@/data/types'
import { secondaryName, useI18n, useMessage, useName, useText } from '@/lib/i18n'
import {
  canViewPerformance,
  canViewWorkload,
  visibleEmployees,
  type Session,
} from '@/lib/permissions'
import {
  calcPromotionReadiness,
  calcSkillGap,
  classifyTalent,
  targetRoleOf,
} from '@/lib/scoring'
import { seriesPalette, talentColor } from '@/lib/theme'
import { useSession } from '@/store/session'

/**
 * §11 Screen 3. The node the user clicked in the constellation carries its
 * layoutId through to the avatar here, so the person does not disappear and
 * reappear — the same dot expands into the profile.
 */
export default function EmployeeProfile() {
  const { id = '' } = useParams()
  const session = useSession() as unknown as Session
  const reduced = useReducedMotion()
  const { t, locale } = useI18n()
  const name = useName()
  const text = useText()
  const renderMsg = useMessage()
  const [openSkill, setOpenSkill] = useState<SkillId | null>(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const [readinessOpen, setReadinessOpen] = useState(false)

  const employee = EMPLOYEES.find((e) => e.id === id)
  const allowed = visibleEmployees(session).some((e) => e.id === id)

  const gap = useMemo(
    () => (employee ? calcSkillGap(employee, targetRoleOf(employee)) : null),
    [employee],
  )
  const readiness = useMemo(() => (employee ? calcPromotionReadiness(employee) : null), [employee])
  const talent = useMemo(() => (employee ? classifyTalent(employee) : null), [employee])

  const historySeries = useMemo(() => {
    if (!employee) return { data: [], series: [] }
    const tracked = Object.keys(employee.skillHistory) as SkillId[]
    const palette = seriesPalette
    const data = HISTORY_MONTHS.map((month) => {
      const row: Record<string, number | string> = { month: month.slice(5) }
      for (const skillId of tracked) {
        const point = employee.skillHistory[skillId]?.find((p) => p.month === month)
        if (point) row[skillId] = point.level
      }
      return row
    })
    return {
      data,
      series: tracked.map((skillId, i) => ({
        key: skillId,
        name: skillName(skillId),
        color: palette[i % palette.length],
      })),
    }
  }, [employee])

  if (!employee) return <Navigate to="/employees" replace />
  if (!allowed) {
    const state: DeniedState = {
      screen: 'employees',
      attempted: `/employees/${id}`,
      suffixKey: 'profile.denied',
    }
    return <Navigate to="/not-authorized" replace state={state} />
  }

  const role = targetRoleOf(employee)
  const requiredById = new Map(role.requiredSkills.map((r) => [r.skillId, r.level]))
  const sortedSkills = [...employee.skills].sort((a, b) => b.level - a.level)
  const radarData = sortedSkills.slice(0, 8).map((s) => ({
    skill: skillName(s.skillId),
    level: s.level,
    required: requiredById.get(s.skillId),
  }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden className="shrink-0">
            <defs>
              <radialGradient id="profile-core" cx="50%" cy="50%">
                <stop offset="0%" stopColor="var(--color-sky)" stopOpacity="0.65" />
                <stop offset="100%" stopColor="var(--color-sky)" />
              </radialGradient>
            </defs>
            <motion.circle
              layoutId={`employee-node-${employee.id}`}
              cx="28"
              cy="28"
              r="20"
              fill="url(#profile-core)"
            />
          </svg>
          <div>
            <h1 className="text-title leading-tight font-semibold">{name(employee)}</h1>
            <p className="mt-0.5 text-small text-haze">
              {employee.title} · {employee.department} · {employee.employmentType}
              <span className="text-haze/70"> · {secondaryName(employee, locale)}</span>
            </p>
            {talent ? (
              <p className="mt-1.5 text-micro" style={{ color: talent.qualified ? talentColor[talent.type] : undefined }}>
                {talent.qualified ? talent.type : t('employees.unclassified')} —{' '}
                <NumericText>{renderMsg(talent.reason)}</NumericText>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canViewPerformance(session, employee.id) ? (
            <Card tone="quiet" className="px-3 py-2">
              <p className="text-micro text-haze">{t('tracking.kpiTotal')}</p>
              <Num value={employee.performance} decimals={1} suffix=" / 5.0" className="text-section text-sky" />
            </Card>
          ) : null}
          {canViewWorkload(session, employee.id) ? (
            <Card tone="quiet" className="px-3 py-2">
              <p className="text-micro text-haze">{t('tracking.col.workload')}</p>
              <Num
                value={employee.workload}
                suffix="%"
                className={employee.workload > 85 ? 'text-section text-warn' : 'text-section text-sky'}
              />
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-3">
          <CardHeader
            title={t('profile.skills.title')}
            hint={t('profile.skills.hint')}
            right={
              <Button variant="ghost" icon={<Info size={14} />} onClick={() => setLegendOpen(true)}>
                {t('scale.name')}
              </Button>
            }
          />
          <ul className="px-5 pb-4">
            {sortedSkills.map((skill) => {
              const required = requiredById.get(skill.skillId)
              const open = openSkill === skill.skillId
              return (
                <li key={skill.skillId} className="border-b border-line/60 py-2.5 last:border-0">
                  <button
                    className="w-full text-left"
                    onClick={() => setOpenSkill(open ? null : skill.skillId)}
                    aria-expanded={open}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-small">
                        {skillName(skill.skillId)}
                        <span className="ml-2 text-micro text-haze">{bandFor(skill.level).name}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Num value={skill.level} decimals={1} className="text-sky" />
                        {required !== undefined ? (
                          <span className="num text-micro text-haze">/ {required.toFixed(1)}</span>
                        ) : null}
                        <ChevronDown
                          size={13}
                          className={`text-haze transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </div>
                    <LevelBar level={skill.level} required={required} className="mt-2" />
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
                        <div className="pt-3 pb-1">
                          {skill.evidence.length === 0 ? (
                            <p className="text-micro text-haze">{t('profile.skills.noEvidence')}</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {skill.evidence.map((evidence, i) => (
                                <li key={i} className="flex items-start gap-2 text-micro">
                                  <Badge tone="muted">{evidence.kind}</Badge>
                                  <span className="text-haze">
                                    {text(evidence.detail)}
                                    <span className="num"> · {evidence.year}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card tone="flat">
            <CardHeader title={t('profile.radar.title')} hint={t('profile.radar.hint', { role: role.title })} />
            <div className="px-2 pb-3">
              <SkillRadarChart data={radarData} currentLabel={t('profile.radar.current')} targetLabel={t('profile.radar.target')} />
            </div>
          </Card>

          {canViewWorkload(session, employee.id) && employee.activeWork ? (
            <Card tone="flat">
              <CardHeader
                title={t('profile.workload.title')}
                hint={t('profile.workload.hint', { workload: employee.workload })}
              />
              <div className="px-5 pb-4">
                <WorkloadBreakdown items={employee.activeWork} />
              </div>
            </Card>
          ) : null}

          <Card tone="flat">
            <CardHeader
              title="Promotion Readiness"
              hint={t('profile.readiness.hint', { role: role.title })}
              right={
                <Button variant="ghost" onClick={() => setReadinessOpen(true)}>
                  {t('profile.readiness.how')}
                </Button>
              }
            />
            <div className="px-5 pb-4">
              <Num
                value={(readiness?.score ?? 0) * 100}
                suffix="%"
                animate
                className="text-display leading-none text-sky"
              />
              <div className="mt-3 h-1.5 w-full rounded-full bg-line/70">
                <motion.div
                  className="h-full rounded-full bg-sky"
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${(readiness?.score ?? 0) * 100}%` }}
                  transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <p className="mt-4 text-micro text-haze">{t('profile.readiness.missing')}</p>
              {readiness && readiness.missingSkills.length > 0 ? (
                <ul className="mt-1.5 space-y-1.5">
                  {readiness.missingSkills.map((item) => (
                    <li key={item.skillId} className="flex items-baseline justify-between gap-3 text-small">
                      <span>{item.skillName}</span>
                      <span className="num text-warn">
                        {item.current.toFixed(1)} → {item.required.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-small">{t('profile.readiness.complete')}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card tone="flat">
        <CardHeader title={t('profile.growth.title')} hint={t('profile.growth.hint')} />
        <div className="px-3 pb-4">
          <SkillHistoryLineChart data={historySeries.data} series={historySeries.series} />
        </div>
      </Card>

      <SlidePanel
        open={legendOpen}
        onClose={() => setLegendOpen(false)}
        title="Skill Level Scale"
        subtitle={t('profile.scale.subtitle')}
      >
        <SkillLevelLegend />
      </SlidePanel>

      <SlidePanel
        open={readinessOpen}
        onClose={() => setReadinessOpen(false)}
        title="Promotion Readiness"
        subtitle={`${name(employee)} → ${role.title}`}
      >
        {readiness ? (
          <>
            <ScoreBreakdown
              components={readiness.components}
              total={readiness.score * 100}
              totalLabel="Promotion Readiness"
            />
            <div className="mt-5 rounded-lg border border-line bg-panel-raised/60 p-3.5">
              <p className="text-micro text-haze">{t('profile.readiness.roleNeeds')}</p>
              <p className="mt-1 text-small leading-relaxed">
                <NumericText>{text(role.rationale)}</NumericText>
              </p>
              <ul className="mt-3 space-y-1.5">
                {gap?.gaps.map((item) => (
                  <li key={item.skillId} className="flex items-baseline justify-between gap-3 text-small">
                    <span className={item.gap > 0 ? '' : 'text-haze'}>{item.skillName}</span>
                    <span className="num">
                      <span className={item.gap > 0 ? 'text-warn' : 'text-sky'}>
                        {item.current.toFixed(1)}
                      </span>
                      <span className="text-haze"> / {item.required.toFixed(1)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-micro leading-relaxed text-haze">
              {t('profile.readiness.caveat')}
            </p>
          </>
        ) : null}
      </SlidePanel>
    </div>
  )
}
