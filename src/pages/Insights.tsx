import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { useI18n, type TranslationKey } from '@/lib/i18n'
import { renderInsight } from '@/lib/i18n/insights'
import { insightScope, visibleEmployees, type Session } from '@/lib/permissions'
import { generateInsights, OWNERSHIP_BAR, type Insight, type InsightKind } from '@/lib/scoring'
import { useSession } from '@/store/session'

/**
 * §11 Screen 8. Grouped by urgency, every card expands to the numbers it came
 * from and the rule that produced it, and every card ends in a link to the
 * screen where something can actually be done about it.
 *
 * At-Risk can still be the long group on this dataset, so it shows the five
 * thinnest benches first and expands to the rest on request, rather than
 * burying the critical finding under them.
 */
const GROUPS: {
  kind: InsightKind
  titleKey: TranslationKey
  hintKey: TranslationKey
  /** Only At-Risk is capped — it is the long group, and it buries the rest. */
  cap?: number
  capNoteKey?: TranslationKey
}[] = [
  {
    kind: 'critical-skill-gap',
    titleKey: 'insights.group.critical',
    hintKey: 'insights.group.critical.hint',
  },
  {
    kind: 'at-risk-skill',
    titleKey: 'insights.group.atRisk',
    hintKey: 'insights.group.atRisk.hint',
    cap: 5,
    capNoteKey: 'insights.group.atRisk.note',
  },
  {
    kind: 'workload-risk',
    titleKey: 'insights.group.workload',
    hintKey: 'insights.group.workload.hint',
  },
  {
    kind: 'growth-opportunity',
    titleKey: 'insights.group.opportunity',
    hintKey: 'insights.group.opportunity.hint',
  },
]

export default function Insights() {
  const session = useSession() as unknown as Session
  const { t } = useI18n()
  const employees = useMemo(() => visibleEmployees(session), [session])
  const insights = useMemo(() => generateInsights(employees), [employees])
  const scope = insightScope(session)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-title leading-tight font-semibold">{t('nav.insights')}</h1>
        <p className="mt-1 text-small text-haze">
          {scope === 'team'
            ? t('common.scopeTeam', { department: session.managerDepartment ?? '' })
            : t('common.scopeOrg')}{' '}
          · {t('insights.hint')}
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = insights.filter((i) => i.kind === group.kind)
        if (items.length === 0) return null
        return <InsightGroup key={group.kind} group={group} items={items} bar={OWNERSHIP_BAR} />
      })}
    </div>
  )
}

export function InsightGroup({
  group,
  items,
  bar,
}: {
  group: (typeof GROUPS)[number]
  items: Insight[]
  bar: number
}) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useI18n()
  const cap = group.cap ?? Number.POSITIVE_INFINITY
  const shown = expanded ? items : items.slice(0, cap)
  const hidden = items.length - shown.length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-section font-semibold">
          {t(group.titleKey)}
          <span className="num ml-2 text-small text-haze">{items.length}</span>
        </h2>
        <p className="text-micro text-haze">
          <NumericText>{t(group.hintKey, { bar: bar.toFixed(1) })}</NumericText>
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
          className="mt-2.5 text-small text-sky transition-colors duration-150 hover:text-text"
        >
          <NumericText>
            {expanded ? t('common.collapse') : t('common.showAll', { count: items.length, hidden })}
          </NumericText>
        </button>
      ) : null}

      {group.capNoteKey && hidden > 0 ? (
        <p className="mt-1.5 text-micro leading-relaxed text-haze">
          <NumericText>{t(group.capNoteKey)}</NumericText>
        </p>
      ) : null}
    </section>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()
  const { t, locale } = useI18n()
  const rendered = renderInsight(insight, t, locale)

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
            <p className="text-body leading-relaxed">
              <NumericText>{rendered.title}</NumericText>
            </p>
            <p className="mt-1 text-micro text-haze">{t('insights.expandHint')}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2">
            <Badge tone={tone}>{t(`kind.${insight.kind}`)}</Badge>
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
                  <p className="text-micro text-haze">{t('insights.computedFrom')}</p>
                  <p className="mt-1 text-small leading-relaxed">
                    <NumericText>{rendered.computedFrom}</NumericText>
                  </p>
                </div>
                <div>
                  <p className="text-micro text-haze">{t('insights.formula')}</p>
                  <p className="mt-1 text-small leading-relaxed text-haze">
                    <NumericText>{rendered.formula}</NumericText>
                  </p>
                </div>
                <Link to={insight.to}>
                  <Button variant="primary">{rendered.actionLabel}</Button>
                </Link>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </li>
  )
}
