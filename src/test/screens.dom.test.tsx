/**
 * @vitest-environment jsdom
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { calcWorkforceHealth } from '@/lib/scoring'
import { useDecisions } from '@/store/decisions'
import { useLearning } from '@/store/learning'
import { useSession } from '@/store/session'

/**
 * §14.12 — every screen must be reachable with no errors and no console
 * warnings. This renders each route under each role that can open it and
 * fails on any console output, so a React key warning or a missing prop
 * cannot ship quietly.
 */
const ROUTES = [
  '/',
  '/dashboard',
  '/employees',
  '/employees/emp-01',
  '/recruit',
  '/team-matching',
  '/learning',
  '/tracking',
  '/insights',
  '/not-authorized',
]

let consoleErrors: string[] = []
let consoleWarnings: string[] = []

beforeEach(() => {
  consoleErrors = []
  consoleWarnings = []
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    consoleErrors.push(args.map(String).join(' '))
  })
  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    consoleWarnings.push(args.map(String).join(' '))
  })
  useDecisions.getState().reset()
  useLearning.getState().reset()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/**
 * Numbers inside engine-written sentences are wrapped in their own <span> for
 * the mono treatment (§14.8), so a regex spanning one is split across nodes.
 * This matches the innermost element whose full text satisfies the pattern.
 */
function withText(pattern: RegExp) {
  const matches = (node: Element | null) => !!node && pattern.test(node.textContent ?? '')
  return (_: string, node: Element | null) =>
    matches(node) && Array.from(node?.children ?? []).every((child) => !matches(child))
}

function expectClean(path: string) {
  expect(consoleErrors, `console.error on ${path}`).toEqual([])
  expect(consoleWarnings, `console.warn on ${path}`).toEqual([])
}

describe('every screen renders for HR', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  for (const path of ROUTES) {
    it(`renders ${path} without console output`, () => {
      renderAt(path)
      expect(document.body.textContent?.length ?? 0).toBeGreaterThan(40)
      expectClean(path)
    })
  }
})

describe('Manager sees a team-scoped product', () => {
  beforeEach(() => useSession.getState().signInAsManager('Product'))

  it('renders the dashboard scoped to the department', () => {
    renderAt('/dashboard')
    expect(screen.getByText(/ทีม Product เท่านั้น/)).toBeTruthy()
    expectClean('/dashboard')
  })

  it('redirects away from Recruit rather than hiding it', () => {
    renderAt('/recruit')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
    expect(screen.getByText(/เปิดให้เฉพาะบทบาท HR/)).toBeTruthy()
  })

  it('refuses a profile outside the manager’s own team', () => {
    // emp-01 is Marketing; this manager leads Product.
    renderAt('/employees/emp-01')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
  })

  it('allows a profile inside the team', () => {
    renderAt('/employees/emp-09')
    expect(screen.getByRole('heading', { name: 'กิตติ ร.' })).toBeTruthy()
    expectClean('/employees/emp-09')
  })
})

describe('Employee sees only themselves', () => {
  beforeEach(() => useSession.getState().signInAsEmployee('emp-08'))

  it('opens their own profile', () => {
    renderAt('/employees/emp-08')
    expect(screen.getByRole('heading', { name: 'ณิชา อ.' })).toBeTruthy()
    expectClean('/employees/emp-08')
  })

  it('is redirected away from another person’s profile', () => {
    renderAt('/employees/emp-02')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
  })

  it('is redirected away from Team Matching and the Dashboard', () => {
    renderAt('/team-matching')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
    cleanup()
    renderAt('/dashboard')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
  })

  it('reaches their own Learning Path', () => {
    renderAt('/learning')
    expect(screen.getByRole('heading', { name: 'Personalized Learning' })).toBeTruthy()
    expectClean('/learning')
  })
})

describe('CEO sees the org without the hiring pipeline', () => {
  beforeEach(() => useSession.getState().signInAsCEO())

  it('opens Workforce Insights', () => {
    renderAt('/insights')
    expect(screen.getByRole('heading', { name: 'AI Workforce Insights' })).toBeTruthy()
    expectClean('/insights')
  })

  it('cannot open Recruit', () => {
    renderAt('/recruit')
    expect(screen.getByText('เข้าหน้านี้ไม่ได้')).toBeTruthy()
  })
})

describe('signed out', () => {
  beforeEach(() => useSession.getState().signOut())

  it('sends a protected route back to the role picker', () => {
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: 'HRADA' })).toBeTruthy()
  })
})

describe('planted cases are visible on screen, not just in the data', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('shows the AI Tools critical gap on Insights', () => {
    renderAt('/insights')
    expect(screen.getByText(withText(/^ไม่มีใครทำ AI Tools ได้ถึงระดับ/))).toBeTruthy()
  })

  it('shows Nicha’s low-outcome learning warning', () => {
    useSession.getState().signInAsEmployee('emp-08')
    renderAt('/learning')
    expect(screen.getAllByText(withText(/ยังไม่เห็นผลที่วัดได้/)).length).toBeGreaterThan(0)
  })

})

describe('Insights grouping (§11 Screen 8)', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('caps At-Risk at five and offers the rest behind an expand', () => {
    renderAt('/insights')
    const health = calcWorkforceHealth()
    expect(health.atRiskSkills.length).toBeGreaterThan(5)

    const atRiskShown = screen.getAllByText(withText(/มีคนเดียวที่ถึงระดับ 4\.0$/))
    expect(atRiskShown).toHaveLength(5)

    const expand = screen.getByText((_, node) =>
      (node?.textContent ?? '').startsWith('แสดงทั้งหมด') && node?.tagName === 'BUTTON',
    )
    fireEvent.click(expand)
    expect(screen.getAllByText(withText(/มีคนเดียวที่ถึงระดับ 4\.0$/))).toHaveLength(
      health.atRiskSkills.length,
    )
  })

  it('shows the five thinnest benches first', () => {
    renderAt('/insights')
    const health = calcWorkforceHealth()
    const expectedTop = health.atRiskSkills.slice(0, 5).map((s) => s.skillName)
    for (const skillName of expectedTop) {
      expect(screen.getByText(withText(new RegExp(`^${skillName} มีคนเดียว`)))).toBeTruthy()
    }
  })

  it('keeps Workload Risk visible instead of hiding it behind the At-Risk cap', () => {
    renderAt('/insights')
    expect(screen.getByText(withText(/^ปิยะ ส\. รับงานอยู่ 92% /))).toBeTruthy()
    expect(screen.getByText(withText(/^วิชัย พ\. รับงานอยู่ 88% /))).toBeTruthy()
  })
})

describe('the type scale survives className merging', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('keeps both the size and the tone on a rendered Badge', () => {
    // Badge composes a scale class with a tone colour through cn(). Before
    // tailwind-merge was taught the scale, the size was silently dropped.
    const { container } = renderAt('/insights')
    const badges = [...container.querySelectorAll('span')].filter((el) =>
      el.className.includes('rounded-md'),
    )
    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      expect(badge.className, badge.textContent ?? '').toContain('text-micro')
    }
  })
})

describe('Entry backdrop (§3.3 — texture, not a second hero)', () => {
  beforeEach(() => useSession.getState().signOut())

  it('sits behind the entry screen, hidden from assistive tech', () => {
    const { container } = renderAt('/')
    const backdrop = container.querySelector('[data-entry-backdrop]')
    expect(backdrop).toBeTruthy()
    expect(backdrop!.getAttribute('aria-hidden')).toBe('true')
    expect(backdrop!.querySelectorAll('circle').length).toBeGreaterThan(20)
    expect(backdrop!.querySelectorAll('line').length).toBeGreaterThan(0)
  })

  it('is static — no animated element anywhere in it', () => {
    const { container } = renderAt('/')
    const backdrop = container.querySelector('[data-entry-backdrop]')!
    expect(backdrop.querySelectorAll('animate, animateTransform')).toHaveLength(0)
    for (const node of backdrop.querySelectorAll('*')) {
      expect(node.getAttribute('style') ?? '').not.toContain('transition')
    }
  })

  it('appears only on the entry screen', () => {
    cleanup()
    useSession.getState().signInAsHR()
    const { container } = renderAt('/dashboard')
    expect(container.querySelector('[data-entry-backdrop]')).toBeNull()
  })
})

describe('Tracking has two modes and both render (§11 Screen 7)', () => {
  beforeEach(() => useSession.getState().signInAsHR())

  it('defaults to the team view and switches to the individual view', () => {
    renderAt('/tracking')
    expect(screen.getByText('Internal Mobility Rate')).toBeTruthy()

    fireEvent.click(screen.getByText('รายบุคคล'))
    expect(screen.getByText('Learning Impact')).toBeTruthy()
    expect(screen.getByText('Career Development')).toBeTruthy()
    // §10.11 — the four extra KPIs the brief insists on keeping.
    expect(screen.getByText('Skill Completion Rate')).toBeTruthy()
    expect(screen.getByText('Employee Engagement in Development Plan')).toBeTruthy()
    expect(screen.getByText('Time to Competency')).toBeTruthy()
    expect(screen.getByText('Manager Satisfaction')).toBeTruthy()
    expectClean('/tracking (individual)')
  })
})

describe('the engine mapping comment survives in scoring.ts (§10.12)', () => {
  it('names all four engines', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/scoring.ts'), 'utf8')
    expect(source).toContain('Skill Intelligence Engine')
    expect(source).toContain('Matching Engine')
    expect(source).toContain('Learning Engine')
    expect(source).toContain('Workforce Intelligence Engine')
  })
})
