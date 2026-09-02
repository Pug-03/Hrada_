import type { DemandSource, Insight, InsightPayload } from '@/lib/scoring'

import type { TFunction } from '.'
import { nameOf } from '.'
import type { Locale } from './types'

/**
 * Turns one Insight's structured payload into the three sentences the
 * Insights and Dashboard screens show. This is the only place that reads
 * InsightPayload — scoring.ts produces the numbers, this renders them.
 */
export interface RenderedInsight {
  title: string
  computedFrom: string
  formula: string
  actionLabel: string
}

function sourceLabel(t: TFunction, source: DemandSource): string {
  return source.kind === 'job'
    ? t('source.job', { name: source.name })
    : t('source.project', { name: source.name })
}

export function renderInsight(insight: Insight, t: TFunction, locale: Locale): RenderedInsight {
  const name = (id: string) => nameOf(id, locale)
  const payload: InsightPayload = insight.payload

  switch (payload.kind) {
    case 'critical-skill-gap':
      return {
        title: t('insight.critical.title', { skill: payload.skillName }),
        computedFrom: t('insight.critical.computed', {
          sources: payload.sources.map((s) => sourceLabel(t, s)).join(' and '),
          level: payload.requiredLevel.toFixed(1),
          headcount: payload.headcount,
        }),
        formula: t('insight.critical.formula'),
        actionLabel: t('insight.critical.action'),
      }

    case 'at-risk-skill':
      return {
        title: t('insight.atRisk.title', { skill: payload.skillName, bar: payload.bar.toFixed(1) }),
        computedFrom: payload.secondBestId
          ? t('insight.atRisk.computed', {
              owner: name(payload.ownerId),
              level: payload.ownerLevel.toFixed(1),
              second: name(payload.secondBestId),
              secondLevel: payload.secondBestLevel.toFixed(1),
            })
          : t('insight.atRisk.computedAlone', {
              owner: name(payload.ownerId),
              level: payload.ownerLevel.toFixed(1),
            }),
        formula: t('insight.atRisk.formula', { bar: payload.bar.toFixed(1) }),
        actionLabel: t('insight.atRisk.action'),
      }

    case 'workload-risk':
      return {
        title: t('insight.workload.title', {
          employee: name(payload.employeeId),
          workload: payload.workload,
        }),
        computedFrom: t('insight.workload.computed', {
          workload: payload.workload,
          performance: payload.performance.toFixed(1),
        }),
        formula: t('insight.workload.formula'),
        actionLabel: t('insight.workload.action'),
      }

    case 'growth-opportunity':
      if (payload.variant === 'growth') {
        return {
          title: t('insight.growth.title', { employee: name(payload.employeeId) }),
          computedFrom: t('insight.growth.computed', {
            growth: `+${payload.growthPerMonth.toFixed(2)}`,
            threshold: payload.threshold,
          }),
          formula: t('insight.growth.formula'),
          actionLabel: t('insight.growth.action'),
        }
      }
      return {
        title: t('insight.promotion.title', {
          employee: name(payload.employeeId),
          percent: payload.percent,
          role: payload.roleTitle,
        }),
        // Component labels (Required skills met, Performance, Time in role) are
        // scoring terminology, kept in English in both locales the same way the
        // spec keeps Skill Gap, Match Score and the rest untranslated (§6).
        computedFrom: payload.components
          .map((c) => `${c.label} ${c.earned}/${c.weight}`)
          .join(' · '),
        formula: t('insight.promotion.formula'),
        actionLabel: t('insight.promotion.action'),
      }
  }
}
