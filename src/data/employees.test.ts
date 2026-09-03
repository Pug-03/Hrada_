import { describe, expect, it } from 'vitest'

import { EMPLOYEES } from './employees'

/**
 * `activeWork` exists to make `workload` explainable, not to be its own
 * dataset with its own bugs — these are the invariants that keep it honest.
 */
describe('activeWork', () => {
  const withActiveWork = EMPLOYEES.filter((e) => e.activeWork)

  it('is present for a real, non-trivial slice of the roster', () => {
    expect(withActiveWork.length).toBeGreaterThanOrEqual(20)
  })

  it('names Piya and Wichai — the two §9.4 Workload Risk cases', () => {
    const names = withActiveWork.map((e) => e.nameLatin)
    expect(names).toContain('Piya S.')
    expect(names).toContain('Wichai P.')
  })

  it('gives everyone 2-4 items, never a lone item or a sprawling list', () => {
    for (const employee of withActiveWork) {
      expect(employee.activeWork!.length, employee.nameLatin).toBeGreaterThanOrEqual(2)
      expect(employee.activeWork!.length, employee.nameLatin).toBeLessThanOrEqual(4)
    }
  })

  it('sums to roughly the workload percentage it explains, never past it', () => {
    for (const employee of withActiveWork) {
      const sum = employee.activeWork!.reduce((total, item) => total + item.loadPct, 0)
      // "Roughly" — the point is a believable breakdown, not a forced-exact
      // sum — but it should never explain *more* capacity than the person
      // is recorded as having, and should land within a few points under.
      expect(sum, employee.nameLatin).toBeLessThanOrEqual(employee.workload)
      expect(sum, employee.nameLatin).toBeGreaterThanOrEqual(employee.workload - 5)
    }
  })

  it('gives every item a positive load and a real status', () => {
    const validStatuses = ['On Track', 'At Risk', 'Wrapping Up', 'Blocked']
    for (const employee of withActiveWork) {
      for (const item of employee.activeWork!) {
        expect(item.loadPct, `${employee.nameLatin} — ${item.project}`).toBeGreaterThan(0)
        expect(validStatuses, `${employee.nameLatin} — ${item.project}`).toContain(item.status)
      }
    }
  })
})
