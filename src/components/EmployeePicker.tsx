import type { Employee } from '@/data/types'

/** Shared scoped picker for the screens that operate on one person at a time. */
export function EmployeePicker({
  employees,
  value,
  onChange,
  label = 'เลือกพนักงาน',
}: {
  employees: Employee[]
  value: string
  onChange: (id: string) => void
  label?: string
}) {
  if (employees.length <= 1) return null
  return (
    <label className="flex items-center gap-2 text-small">
      <span className="text-haze">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring rounded-lg border border-line bg-panel px-3 py-2 text-small outline-none transition-colors duration-150 hover:bg-panel-raised"
      >
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id} className="bg-panel">
            {employee.name} · {employee.title}
          </option>
        ))}
      </select>
    </label>
  )
}
