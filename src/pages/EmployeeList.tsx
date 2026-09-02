import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Num } from '@/components/ui/Num'
import { useI18n, useName } from '@/lib/i18n'
import { visibleEmployees, type Session } from '@/lib/permissions'
import { classifyTalent, calcPromotionReadiness } from '@/lib/scoring'
import { talentColor } from '@/lib/theme'
import { useSession } from '@/store/session'

/** §11 Screen 3 — pick a person. Scope follows §8, so the list itself differs per role. */
export default function EmployeeList() {
  const session = useSession() as unknown as Session
  const { t } = useI18n()
  const name = useName()
  const [query, setQuery] = useState('')
  const employees = useMemo(() => visibleEmployees(session), [session])

  const filtered = employees.filter((e) =>
    `${e.name} ${e.nameLatin} ${e.title} ${e.department}`.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-title leading-tight font-semibold">{t('nav.employees')}</h1>
        <p className="mt-1 text-small text-haze">
          {session.role === 'Employee'
            ? t('employees.hint.self')
            : session.role === 'Manager'
              ? t('employees.hint.team', { department: session.managerDepartment ?? '' })
              : t('employees.hint.all')}
        </p>
      </div>

      <label className="focus-ring-within flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2">
        <Search size={15} className="text-haze" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('employees.search')}
          className="w-full bg-transparent text-small outline-none placeholder:text-haze/70"
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('employees.empty.title', { query })}
          action={t('employees.empty.action')}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((employee) => {
            const talent = classifyTalent(employee)
            const readiness = calcPromotionReadiness(employee)
            return (
              <Link key={employee.id} to={`/employees/${employee.id}`}>
                <Card tone="flat" interactive className="h-full p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body font-semibold">{name(employee)}</p>
                      <p className="truncate text-small text-haze">{employee.title}</p>
                    </div>
                    <Badge tone="muted">{employee.department}</Badge>
                  </div>
                  <p
                    className="mt-3 text-micro"
                    style={{ color: talent.qualified ? talentColor[talent.type] : undefined }}
                  >
                    {talent.qualified ? talent.type : t('employees.unclassified')}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between text-micro text-haze">
                    <span>Promotion Readiness</span>
                    <Num value={readiness.score * 100} decimals={0} suffix="%" className="text-sky" />
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-line/70">
                    <div
                      className="h-full rounded-full bg-sky"
                      style={{ width: `${readiness.score * 100}%` }}
                    />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
