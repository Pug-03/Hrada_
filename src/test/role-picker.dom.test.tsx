/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { EMPLOYEES } from '@/data/employees'
import { useSession } from '@/store/session'

/**
 * At 14 people, listing everyone inline was fine. At 50 it is not — this
 * covers the department-grouped, searchable picker that replaced the flat
 * list in both the entry screen and the header's role switcher (§6 of the
 * scale-up brief): a collapsed department shows its count and a small
 * sample, not its whole roster, and a search reaches anyone by either name
 * form regardless of which language mode is active.
 */
afterEach(cleanup)

function renderEntry() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

/** The employee-section department row — distinct from the Manager sign-in
 * button that happens to share the same department name as its label. */
function departmentRow(container: HTMLElement, department: string): HTMLElement {
  const candidates = [...container.querySelectorAll('button')].filter(
    (b) => b.textContent?.startsWith(department) && /\d/.test(b.textContent ?? ''),
  )
  if (candidates.length !== 1) {
    throw new Error(`expected exactly one department row for ${department}, found ${candidates.length}`)
  }
  return candidates[0]
}

describe('Entry screen employee picker at scale', () => {
  beforeEach(() => useSession.getState().signOut())

  it('shows a bounded sample per department, not all 50 names', () => {
    const { container } = renderEntry()
    const nameLikeButtons = [...container.querySelectorAll('button')].filter((b) =>
      EMPLOYEES.some((e) => b.textContent?.includes(e.title) && b.textContent === `${e.name}${e.title}`),
    )
    // Nobody has their own sign-in button rendered until a department opens —
    // the default view is samples-in-text only, not per-person controls.
    expect(nameLikeButtons).toHaveLength(0)
  })

  it('shows a headcount for every department', () => {
    const { container } = renderEntry()
    for (const [department, count] of [
      ['Marketing', 10],
      ['Sales', 11],
      ['Data', 8],
      ['Product', 13],
      ['Operations', 8],
    ] as const) {
      expect(departmentRow(container, department).textContent).toContain(String(count))
    }
  })

  it('expands a department to reveal individual sign-in buttons, and only that one', () => {
    const { container } = renderEntry()
    fireEvent.click(departmentRow(container, 'Marketing'))
    // A real per-person sign-in button pairs the name with the title right
    // next to it — distinct from Sales' own (still collapsed) department
    // row, whose accessible name also happens to mention Wichai's name as
    // part of its comma-joined sample preview, with no title attached.
    expect(screen.getByRole('button', { name: /เจนจิรา ว\..*Marketing Executive/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /วิชัย พ\..*Sales Manager/ })).toBeNull()

    fireEvent.click(departmentRow(container, 'Marketing'))
    expect(screen.queryByRole('button', { name: /เจนจิรา ว\..*Marketing Executive/ })).toBeNull()
  })

  it('search finds a person by their Thai name', () => {
    renderEntry()
    fireEvent.change(screen.getByPlaceholderText('ค้นหาชื่อ ตำแหน่ง หรือแผนก'), {
      target: { value: 'เจนจิรา' },
    })
    expect(screen.getByRole('button', { name: /เจนจิรา ว\./ })).toBeTruthy()
  })

  it('search finds the same person by their Latin name, even in Thai mode', () => {
    // A real gap this closes: the picker used to only check whichever name
    // form the active locale shows first, so a Latin search matched nothing
    // while the UI was in Thai.
    renderEntry()
    fireEvent.change(screen.getByPlaceholderText('ค้นหาชื่อ ตำแหน่ง หรือแผนก'), {
      target: { value: 'Jenjira' },
    })
    expect(screen.getByRole('button', { name: /เจนจิรา ว\./ })).toBeTruthy()
  })

  it('signs in as the searched-for person on click', async () => {
    renderEntry()
    fireEvent.change(screen.getByPlaceholderText('ค้นหาชื่อ ตำแหน่ง หรือแผนก'), {
      target: { value: 'Jenjira' },
    })
    fireEvent.click(screen.getByRole('button', { name: /เจนจิรา ว\./ }))
    expect(await screen.findByRole('heading', { name: 'เจนจิรา ว.' })).toBeTruthy()
  })

  it('is reachable through the department accordion for a generated (not hand-authored) person', () => {
    // getAll, not get: the name pool is finite, so two of the 36 generated
    // people can land on the exact same (first name, surname initial) pair
    // by chance — the point here is that the person is reachable at all, not
    // that their name string happens to be unique in this particular run.
    const generated = EMPLOYEES[EMPLOYEES.length - 1]
    const { container } = renderEntry()
    fireEvent.click(departmentRow(container, generated.department))
    const matches = screen.getAllByRole('button', {
      name: new RegExp(generated.name.replaceAll('.', '\\.')),
    })
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})

describe('header role switcher at scale', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  function renderDashboard() {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
  }

  /**
   * The dropdown's own container. Every query in this describe block scopes
   * to it — the Dashboard behind it renders the Skill Constellation, whose
   * SVG nodes are ALSO role="button" with an aria-label of "name — title",
   * so an unscoped screen.getByRole(...) can match a node on the canvas as
   * readily as an entry in the dropdown.
   */
  function openSwitcher(container: HTMLElement): HTMLElement {
    const trigger = [...container.querySelectorAll('header button')].find((b) =>
      b.textContent?.includes('บทบาท'),
    )!
    fireEvent.click(trigger)
    return container.querySelector<HTMLElement>('.absolute.right-0')!
  }

  it('groups the employee section by department instead of listing everyone', () => {
    const { container } = renderDashboard()
    const menu = openSwitcher(container)
    expect(within(menu).queryByRole('button', { name: /เจนจิรา ว\./ })).toBeNull()
    // The Employee-section department row: labelled with the department name
    // AND a headcount, distinct from the plain Manager sign-in button that
    // happens to share the department name as its own label.
    const row = [...menu.querySelectorAll('button')].find(
      (b) => b.textContent?.startsWith('Marketing') && /\d/.test(b.textContent ?? ''),
    )
    expect(row).toBeTruthy()
    expect(row!.textContent).toContain('10')
  })

  it('search narrows to matching people across departments, by either name form', () => {
    // "Piya" is a substring match on more than just Piya S. — it also
    // catches anyone whose generated first name is "Piyapong" — so this
    // anchors the regex to the start of the accessible name rather than
    // assuming the search returns exactly one person.
    const { container } = renderDashboard()
    const menu = openSwitcher(container)
    fireEvent.change(within(menu).getByPlaceholderText('ค้นหาชื่อ ตำแหน่ง หรือแผนก'), {
      target: { value: 'Piya' },
    })
    expect(within(menu).getByRole('button', { name: /^ปิยะ ส\./ })).toBeTruthy()
  })

  it('every generated employee is reachable through search, not just the hand-authored 14', () => {
    const generated = EMPLOYEES[EMPLOYEES.length - 1]
    const { container } = renderDashboard()
    const menu = openSwitcher(container)
    // The full Latin name, not just the first word — first names are drawn
    // from a shared pool and can repeat across 50 people, which would make
    // this ambiguous rather than proving the specific person is reachable.
    fireEvent.change(within(menu).getByPlaceholderText('ค้นหาชื่อ ตำแหน่ง หรือแผนก'), {
      target: { value: generated.nameLatin },
    })
    const matches = within(menu).getAllByRole('button', {
      name: new RegExp(generated.name.replaceAll('.', '\\.')),
    })
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })
})
