/**
 * §9.3 — the six months of history the prototype tracks.
 *
 * Its own module rather than living in employees.ts, because
 * generateEmployees.ts needs it too and importing it from employees.ts would
 * be circular — employees.ts is what assembles the hand-authored people and
 * the generated ones together.
 */
export const HISTORY_MONTHS = [
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
] as const
