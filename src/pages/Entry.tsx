import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, RotateCcw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EntryBackdrop } from '@/components/EntryBackdrop'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NumericText } from '@/components/ui/NumericText'
import { EMPLOYEES, ORG } from '@/data/employees'
import type { Department } from '@/data/types'
import { useI18n, useName, type TranslationKey } from '@/lib/i18n'
import { homeFor } from '@/lib/permissions'
import { useSession } from '@/store/session'

const EMPLOYEES_BY_DEPARTMENT: Record<Department, typeof EMPLOYEES> = ORG.departments.reduce(
  (acc, department) => {
    acc[department] = EMPLOYEES.filter((e) => e.department === department)
    return acc
  },
  {} as Record<Department, typeof EMPLOYEES>,
)

/**
 * §11 Screen 1 — pick a role, and see what the product is for before picking.
 * The loop strip is a compact orienting moment, not a landing page: the point
 * of HRADA is that the four stages feed each other, and that reads faster as a
 * diagram than as a paragraph.
 */
const LOOP: { key: string; labelKey: TranslationKey }[] = [
  { key: 'RECRUIT', labelKey: 'entry.loop.recruit' },
  { key: 'MATCH', labelKey: 'entry.loop.match' },
  { key: 'DEVELOP', labelKey: 'entry.loop.develop' },
  { key: 'TRACK', labelKey: 'entry.loop.track' },
]

export default function Entry() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const { t } = useI18n()
  const name = useName()
  const [query, setQuery] = useState('')
  const [openDept, setOpenDept] = useState<Department | null>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return EMPLOYEES.filter(
      (e) =>
        e.name.includes(q) ||
        e.nameLatin.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const enter = (fn: () => void) => {
    fn()
    navigate(homeFor(useSession.getState()))
  }

  return (
    <div className="relative isolate mx-auto max-w-3xl py-6">
      <EntryBackdrop />
      <p className="text-small text-haze">
        {ORG.name} · {ORG.industry} ·{' '}
        <NumericText>{t('app.headcount', { count: ORG.totalHeadcount })}</NumericText>
        <span className="text-haze/70">
          {' '}
          (<NumericText>{t('entry.sample', { count: EMPLOYEES.length })}</NumericText>)
        </span>
      </p>
      <h1 className="mt-2 text-display leading-[1.1] font-semibold tracking-tight">HRADA</h1>
      <p className="mt-2 max-w-xl text-body leading-relaxed text-haze">{t('entry.lede')}</p>

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
              <p className="text-small font-semibold">{stage.key}</p>
              <p className="text-micro text-haze">{t(stage.labelKey)}</p>
            </div>
            {i < LOOP.length - 1 ? <ArrowRight size={14} className="text-haze/60" /> : null}
          </motion.div>
        ))}
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.36, duration: 0.3 }}
          className="flex items-center gap-1.5 text-micro text-haze"
        >
          <RotateCcw size={13} />
          {t('entry.loop.back')}
        </motion.div>
      </div>

      <div className="mt-9 grid gap-3 sm:grid-cols-2">
        <Card className="p-4" tone="flat">
          <h2 className="text-body font-semibold">{t('entry.org.title')}</h2>
          <p className="mt-1 text-small text-haze">{t('entry.org.hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => enter(useSession.getState().signInAsHR)}>
              {t('role.hr')}
            </Button>
            <Button onClick={() => enter(useSession.getState().signInAsCEO)}>{t('role.ceo')}</Button>
          </div>
          <p className="mt-3 text-micro leading-relaxed text-haze">{t('entry.org.note')}</p>
        </Card>

        <Card className="p-4" tone="flat">
          <h2 className="text-body font-semibold">{t('entry.manager.title')}</h2>
          <p className="mt-1 text-small text-haze">{t('entry.manager.hint')}</p>
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
          <h2 className="text-body font-semibold">{t('entry.employee.title')}</h2>
          <p className="mt-1 text-small text-haze">{t('entry.employee.hint')}</p>

          <label className="focus-ring-within mt-3 flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2">
            <Search size={14} className="shrink-0 text-haze" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('employees.search')}
              className="w-full bg-transparent text-small outline-none placeholder:text-haze/70"
            />
          </label>

          {matches ? (
            matches.length === 0 ? (
              <p className="mt-3 text-small text-haze">{t('role.noMatches', { query })}</p>
            ) : (
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {matches.map((employee) => (
                  <EmployeeButton key={employee.id} employee={employee} onPick={enter} name={name} />
                ))}
              </div>
            )
          ) : (
            <div className="mt-3 space-y-1.5">
              {ORG.departments.map((department) => {
                const members = EMPLOYEES_BY_DEPARTMENT[department]
                const isOpen = openDept === department
                return (
                  <div key={department} className="rounded-lg border border-line/70">
                    <button
                      onClick={() => setOpenDept(isOpen ? null : department)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-small transition-colors duration-150 hover:bg-panel-raised"
                      aria-expanded={isOpen}
                    >
                      <span>{department}</span>
                      <span className="flex items-center gap-2 text-micro text-haze">
                        <NumericText>{t('common.people', { count: members.length })}</NumericText>
                        {!isOpen ? (
                          <span className="hidden truncate sm:inline">
                            {members
                              .slice(0, 4)
                              .map((e) => name(e))
                              .join(', ')}
                          </span>
                        ) : null}
                        <ChevronDown
                          size={13}
                          className={`shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="grid gap-1.5 border-t border-line/70 p-2 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((employee) => (
                          <EmployeeButton key={employee.id} employee={employee} onPick={enter} name={name} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <Card tone="quiet" className="mt-4 p-4">
        <p className="text-small leading-relaxed text-haze">{t('entry.principle')}</p>
        <p className="mt-2 text-micro text-haze">
          <NumericText>{t('entry.liveNumbers', { file: 'src/lib/scoring.ts' })}</NumericText>
        </p>
      </Card>
    </div>
  )
}

function EmployeeButton({
  employee,
  onPick,
  name,
}: {
  employee: (typeof EMPLOYEES)[number]
  onPick: (fn: () => void) => void
  name: (employee: (typeof EMPLOYEES)[number]) => string
}) {
  return (
    <button
      onClick={() => onPick(() => useSession.getState().signInAsEmployee(employee.id))}
      className="flex items-baseline justify-between gap-2 rounded-lg border border-line/70 px-3 py-2 text-left text-small transition-[background-color,transform] duration-150 hover:-translate-y-0.5 hover:bg-panel-raised"
    >
      <span className="truncate">{name(employee)}</span>
      <span className="shrink-0 text-micro text-haze">{employee.title}</span>
    </button>
  )
}
