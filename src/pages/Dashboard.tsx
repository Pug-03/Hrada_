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
import { useI18n } from '@/lib/i18n'
import { renderInsight } from '@/lib/i18n/insights'
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
  const { t, locale } = useI18n()
  const employees = useMemo(() => visibleEmployees(session), [session])
  const scope = insightScope(session)

  const health = useMemo(() => calcWorkforceHealth(employees), [employees])
  const coverage = useMemo(() => skillCoverageByDepartment(employees), [employees])
  const insights = useMemo(() => generateInsights(employees), [employees])

  const kpis = [
    {
      label: t('dashboard.kpi.employees'),
      value: health.headcount,
      decimals: 0,
      explain:
        scope === 'team'
          ? t('dashboard.kpi.employees.explainTeam')
          : t('dashboard.kpi.employees.explainOrg'),
    },
    {
      label: t('dashboard.kpi.coverage'),
      value: health.skillCoverage * 100,
      suffix: '%',
      decimals: 0,
      explain: t('dashboard.kpi.coverage.explain', {
        covered: health.coveredSkills.length,
        total: health.demand.length,
      }),
    },
    {
      label: t('dashboard.kpi.critical'),
      value: health.criticalSkillGaps.length,
      decimals: 0,
      tone: health.criticalSkillGaps.length > 0 ? 'critical' : undefined,
      explain: t('dashboard.kpi.critical.explain'),
    },
    {
      label: t('dashboard.kpi.highPotential'),
      value: health.highPotential.length,
      decimals: 0,
      explain: t('dashboard.kpi.highPotential.explain'),
    },
    {
      label: t('dashboard.kpi.atRisk'),
      value: health.atRiskSkills.length,
      decimals: 0,
      tone: health.atRiskSkills.length > 0 ? 'warn' : undefined,
      explain: t('dashboard.kpi.atRisk.explain', { bar: OWNERSHIP_BAR.toFixed(1) }),
    },
    {
      label: t('dashboard.kpi.mobility'),
      value: health.internalMobilityRate * 100,
      suffix: '%',
      decimals: 0,
      explain: t('dashboard.kpi.mobility.explain'),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-title leading-tight font-semibold">{t('nav.dashboard')}</h1>
          <p className="mt-1 text-small text-haze">
            {scope === 'team'
              ? t('common.scopeTeam', { department: session.managerDepartment ?? '' })
              : t('common.scopeOrg')}
          </p>
        </div>
        <Badge tone="sky">{t('dashboard.liveBadge')}</Badge>
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
          hint={t('dashboard.constellation.hint')}
          right={
            <Badge tone="muted">
              <span className="num">{employees.length}</span> {t('common.peopleUnit')}
            </Badge>
          }
        />
        <div className="bg-gradient-to-b from-signal/[0.07] to-transparent px-3 pb-4">
          <SkillConstellation employees={employees} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card tone="flat" className="lg:col-span-2">
          <CardHeader title={t('dashboard.coverage.title')} hint={t('dashboard.coverage.hint')} />
          <div className="px-3 pb-4">
            <CoverageBarChart data={coverage} />
          </div>
        </Card>

        <Card tone="flat" className="lg:col-span-3">
          <CardHeader
            title={t('dashboard.insights.title')}
            hint={t('dashboard.insights.hint')}
            right={
              <Link to="/insights" className="text-small text-sky hover:underline">
                {t('common.viewAll')}
              </Link>
            }
          />
          <ul className="space-y-2 px-5 pb-4">
            {insights.slice(0, 5).map((insight) => {
              const rendered = renderInsight(insight, t, locale)
              return (
                <li
                  key={insight.id}
                  className="rounded-lg border border-line bg-panel-raised/60 px-3.5 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-small leading-relaxed">
                      <NumericText>{rendered.title}</NumericText>
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
                      {t(`kind.${insight.kind}`)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-micro leading-relaxed text-haze">
                    <NumericText>{rendered.computedFrom}</NumericText>
                  </p>
                </li>
              )
            })}
            {insights.length === 0 ? (
              <li className="py-6 text-center text-small text-haze">
                {t('dashboard.insights.empty')}
              </li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  )
}
