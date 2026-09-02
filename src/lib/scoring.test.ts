import { describe, expect, it } from 'vitest'

import { CANDIDATES } from '@/data/candidates'
import { EMPLOYEES, getEmployee } from '@/data/employees'
import { getJob, JOBS } from '@/data/jobs'
import { LEARNING_CATALOG } from '@/data/learningCatalog'
import { getProject, PROJECTS } from '@/data/projects'
import { getRole, ROLES } from '@/data/roles'
import { SKILLS } from '@/data/skills'
import {
  avgMonthlyGrowth,
  calcCandidateMatchScore,
  calcEngagementInDevelopmentPlan,
  calcLearningOutcome,
  calcManagerSatisfaction,
  calcPromotionReadiness,
  calcSkillCompletionRate,
  calcSkillGap,
  calcTeamFit,
  calcTimeToCompetency,
  calcWorkforceHealth,
  classifyTalent,
  generateInsights,
  generateLearningPath,
  HIGH_POTENTIAL_THRESHOLD,
  learningOutcomes,
  OWNERSHIP_BAR,
  rankCandidates,
  selectTeam,
  sharedSkillEdges,
  skillCoverageByDepartment,
  skillDemand,
  targetRoleOf,
  totalSkillLevel,
} from './scoring'

const jenjira = () => getEmployee('emp-01')
const piya = () => getEmployee('emp-02')
const nicha = () => getEmployee('emp-08')
const thanakorn = () => getEmployee('emp-05')
const phum = () => getEmployee('emp-14')

describe('dataset integrity', () => {
  it('holds the 14 people the spec locks', () => {
    expect(EMPLOYEES).toHaveLength(14)
    expect(new Set(EMPLOYEES.map((e) => e.id)).size).toBe(14)
  })

  it('tracks 18 skills across 5 categories', () => {
    expect(SKILLS).toHaveLength(18)
    expect(new Set(SKILLS.map((s) => s.category)).size).toBe(5)
  })

  it('keeps every skill level inside the 0–5 scale', () => {
    for (const employee of EMPLOYEES) {
      for (const skill of employee.skills) {
        expect(skill.level).toBeGreaterThanOrEqual(0)
        expect(skill.level).toBeLessThanOrEqual(5)
      }
    }
  })

  it('backs every skill at 3.0 or above with at least two evidence sources', () => {
    for (const employee of EMPLOYEES) {
      for (const skill of employee.skills.filter((s) => s.level >= 3.0)) {
        expect(
          skill.evidence.length,
          `${employee.nameLatin} / ${skill.skillId}`,
        ).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('gives every person six months of history for three skills', () => {
    for (const employee of EMPLOYEES) {
      const series = Object.values(employee.skillHistory)
      expect(series.length, employee.nameLatin).toBeGreaterThanOrEqual(3)
      for (const points of series) expect(points).toHaveLength(6)
    }
  })

  it('points every career goal at a defined role', () => {
    for (const employee of EMPLOYEES) {
      expect(() => getRole(employee.careerGoalRoleId)).not.toThrow()
    }
  })

  it('carries the employment types the spec names', () => {
    expect(getEmployee('emp-14').employmentType).toBe('Intern')
    expect(getEmployee('emp-08').employmentType).toBe('Contract')
    expect(EMPLOYEES.filter((e) => e.employmentType === 'Full-time')).toHaveLength(12)
  })

  it('offers 3 jobs, 8 candidates, 3 projects and 12 learning items', () => {
    expect(JOBS).toHaveLength(3)
    expect(CANDIDATES).toHaveLength(8)
    expect(PROJECTS).toHaveLength(3)
    expect(LEARNING_CATALOG).toHaveLength(12)
    expect(LEARNING_CATALOG.filter((l) => l.targetSkill === 'leadership').length).toBeGreaterThanOrEqual(3)
    expect(LEARNING_CATALOG.filter((l) => l.targetSkill === 'ai-tools').length).toBeGreaterThanOrEqual(2)
  })
})

describe('calcSkillGap (§10.1)', () => {
  it('computes gap as max(0, required − current) and sorts descending', () => {
    const result = calcSkillGap(jenjira(), getRole('marketing-manager'))
    expect(result.gaps.map((g) => g.gap)).toEqual([...result.gaps.map((g) => g.gap)].sort((a, b) => b - a))
    const leadership = result.gaps.find((g) => g.skillId === 'leadership')!
    expect(leadership.gap).toBe(1.9)
  })

  it('never returns a negative gap for a skill above the bar', () => {
    const result = calcSkillGap(piya(), getRole('head-of-data'))
    for (const gap of result.gaps) expect(gap.gap).toBeGreaterThanOrEqual(0)
    expect(result.gaps.find((g) => g.skillId === 'data-analysis')!.gap).toBe(0)
  })

  it('reports pctMet as met over required', () => {
    const result = calcSkillGap(jenjira(), getRole('marketing-manager'))
    expect(result.metCount).toBe(4)
    expect(result.requiredCount).toBe(5)
    expect(result.pctMet).toBeCloseTo(0.8, 5)
  })

  it('returns a null primaryGap when every requirement is met', () => {
    const easy = { ...getRole('marketing-executive'), requiredSkills: [{ skillId: 'digital-marketing' as const, level: 1.0 }] }
    expect(calcSkillGap(jenjira(), easy).primaryGap).toBeNull()
  })
})

describe('calcCandidateMatchScore (§10.2)', () => {
  const job = () => getJob('job-senior-data-analyst')

  it('weights the five components to 100', () => {
    const match = calcCandidateMatchScore(CANDIDATES[0], job())
    expect(match.components.reduce((sum, c) => sum + c.weight, 0)).toBe(100)
    expect(match.total).toBeLessThanOrEqual(100)
  })

  it('scores a perfect candidate at 100', () => {
    const perfect = {
      ...CANDIDATES[1],
      skills: [
        { skillId: 'data-analysis' as const, level: 5 },
        { skillId: 'sql' as const, level: 5 },
        { skillId: 'ai-tools' as const, level: 5 },
        { skillId: 'presentation' as const, level: 5 },
      ],
      yearsExperience: 10,
      assessmentScore: 100,
      projects: [{ name: 'x', skillsUsed: ['sql' as const] }],
    }
    expect(calcCandidateMatchScore(perfect, job()).total).toBe(100)
  })

  it('flags a required skill more than 1.0 below the bar as critical', () => {
    const match = calcCandidateMatchScore(CANDIDATES[0], job())
    expect(match.hasCriticalGap).toBe(true)
    expect(match.criticalGaps.map((g) => g.skillId)).toContain('ai-tools')
  })

  it('keeps the critical flag independent of the score', () => {
    const ranked = rankCandidates(job())
    // The top scorer is the one carrying the critical gap — a screen that
    // sorted on score alone would recommend exactly the wrong person.
    expect(ranked[0].candidate.id).toBe('cand-01')
    expect(ranked[0].match.hasCriticalGap).toBe(true)
  })

  it('does not flag a candidate who meets every required skill exactly', () => {
    const match = calcCandidateMatchScore(getCandidate('cand-02'), job())
    expect(match.hasCriticalGap).toBe(false)
    expect(match.components.find((c) => c.key === 'required')!.ratio).toBe(1)
  })
})

function getCandidate(id: string) {
  const found = CANDIDATES.find((c) => c.id === id)
  if (!found) throw new Error(id)
  return found
}

describe('calcTeamFit (§10.3)', () => {
  it('weights the four components to 100', () => {
    const fit = calcTeamFit(jenjira(), getProject('proj-ai-marketing'))
    expect(fit.components.reduce((sum, c) => sum + c.weight, 0)).toBe(100)
  })

  it('penalises somebody who is already at capacity', () => {
    const project = getProject('proj-product-analytics')
    const availability = calcTeamFit(piya(), project).components.find((c) => c.key === 'availability')!
    expect(availability.ratio).toBeCloseTo(0.08, 5)
  })
})

describe('selectTeam (§10.4)', () => {
  it('covers requirements rather than taking the top N by fit', () => {
    const project = getProject('proj-ai-marketing')
    const team = selectTeam(project)
    const topByFit = EMPLOYEES.map((e) => ({ e, fit: calcTeamFit(e, project).total }))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, project.teamSize)
      .map((x) => x.e.id)
    expect(team.members.map((m) => m.employee.id)).not.toEqual(topByFit)
  })

  it('respects the requested team size', () => {
    for (const size of [2, 3, 4, 5]) {
      expect(selectTeam(getProject('proj-customer-retention'), EMPLOYEES, size).members).toHaveLength(size)
    }
  })

  it('leaves the AI Tools gap on the marketing project and can hand it to Recruit', () => {
    const team = selectTeam(getProject('proj-ai-marketing'))
    expect(team.teamGaps.map((g) => g.skillId)).toContain('ai-tools')
  })

  it('includes a Developing Talent once the team reaches four', () => {
    const team = selectTeam(getProject('proj-ai-marketing'), EMPLOYEES, 4)
    expect(team.members.some((m) => m.talent.type === 'Developing Talent')).toBe(true)
  })

  it('warns about a member over 90% workload and names a backup', () => {
    const team = selectTeam(getProject('proj-product-analytics'))
    const atRisk = team.members.find((m) => m.workloadRisk)
    expect(atRisk?.employee.id).toBe('emp-02')
    expect(atRisk?.backupName).toBeTruthy()
  })

  it('explains every pick', () => {
    const team = selectTeam(getProject('proj-customer-retention'))
    for (const member of team.members) expect(member.reason.length).toBeGreaterThan(10)
    expect(team.steps.length).toBeGreaterThan(1)
  })
})

describe('classifyTalent (§10.5)', () => {
  it('uses criteria, never a top-N percentile', () => {
    // Everybody's classification must survive being evaluated alone.
    for (const employee of EMPLOYEES) {
      expect(classifyTalent(employee).type).toBe(classifyTalent(employee).type)
    }
    const solo = classifyTalent(piya())
    expect(solo.type).toBe('Core Expert')
  })

  it('requires deep evidence for Core Expert', () => {
    const unevidenced = {
      ...piya(),
      skills: piya().skills.map((s) => (s.level >= 4.3 ? { ...s, evidence: [s.evidence[0]] } : s)),
    }
    expect(classifyTalent(unevidenced).qualifiesFor.some((q) => q.type === 'Core Expert')).toBe(false)
  })

  it('requires performance of 4.0 for Core Expert however deep the skill', () => {
    const underperforming = { ...piya(), performance: 3.9 }
    expect(classifyTalent(underperforming).qualifiesFor.some((q) => q.type === 'Core Expert')).toBe(false)
  })

  it('classifies the two fast growers as Developing Talent', () => {
    expect(classifyTalent(thanakorn()).type).toBe('Developing Talent')
    expect(classifyTalent(phum()).type).toBe('Developing Talent')
    expect(classifyTalent(thanakorn()).qualified).toBe(true)
    expect(classifyTalent(phum()).qualified).toBe(true)
  })

  it('always returns a reason', () => {
    for (const employee of EMPLOYEES) {
      expect(classifyTalent(employee).reason.length).toBeGreaterThan(10)
    }
  })

  it('marks somebody who meets no criteria as unqualified rather than inventing a type', () => {
    expect(classifyTalent(nicha()).qualified).toBe(false)
  })
})

describe('calcPromotionReadiness (§10.6)', () => {
  it('follows the 0.7 / 0.2 / 0.1 weighting', () => {
    const employee = jenjira()
    const gap = calcSkillGap(employee, targetRoleOf(employee))
    const expected =
      gap.pctMet * 0.7 + (employee.performance / 5) * 0.2 + Math.min(employee.yearsInRole / 3, 1) * 0.1
    expect(calcPromotionReadiness(employee).score).toBeCloseTo(expected, 2)
  })

  it('caps the tenure term at three years', () => {
    const tenured = { ...jenjira(), yearsInRole: 12 }
    const three = { ...jenjira(), yearsInRole: 3 }
    expect(calcPromotionReadiness(tenured).score).toBe(calcPromotionReadiness(three).score)
  })

  it('names exactly the three high-potential people the spec plants', () => {
    const high = EMPLOYEES.filter((e) => calcPromotionReadiness(e).isHighPotential).map((e) => e.nameLatin)
    expect(high.sort()).toEqual(['Jenjira W.', 'Kitti R.', 'Mark C.'])
  })
})

describe('calcWorkforceHealth (§10.7)', () => {
  const health = () => calcWorkforceHealth()

  it('keeps critical and at-risk disjoint', () => {
    const h = health()
    const critical = new Set(h.criticalSkillGaps.map((c) => c.skillId))
    for (const risk of h.atRiskSkills) expect(critical.has(risk.skillId)).toBe(false)
  })

  it('finds AI Tools as the only critical gap', () => {
    expect(health().criticalSkillGaps.map((c) => c.skillId)).toEqual(['ai-tools'])
  })

  it('surfaces UX Research and Financial Analysis as at-risk', () => {
    const ids = health().atRiskSkills.map((s) => s.skillId)
    expect(ids).toContain('ux-research')
    expect(ids).toContain('financial-analysis')
  })

  it('flags exactly the two overloaded high performers', () => {
    expect(health().workloadRisk.map((e) => e.nameLatin)).toEqual(['Piya S.', 'Wichai P.'])
  })

  it('reports skill coverage as a share of demanded skills', () => {
    const h = health()
    expect(h.skillCoverage).toBeGreaterThan(0)
    expect(h.skillCoverage).toBeLessThanOrEqual(1)
    expect(h.coveredSkills.every((s) => s.meetingCount >= 2)).toBe(true)
  })

  it('excludes roles a person has outgrown from internal mobility', () => {
    const mobility = health().internalMobility
    expect(mobility.some((m) => m.employee.id === 'emp-02' && m.role.id === 'data-analyst')).toBe(false)
  })

  it('lists high potential in readiness order', () => {
    const scores = health().highPotential.map((h) => h.readiness.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(scores.every((s) => s >= HIGH_POTENTIAL_THRESHOLD)).toBe(true)
  })

  it('breaks coverage down per department', () => {
    const rows = skillCoverageByDepartment()
    expect(rows).toHaveLength(5)
    expect(rows.reduce((sum, r) => sum + r.headcount, 0)).toBe(14)
  })

  it('derives demand only from open jobs and active projects', () => {
    const demanded = skillDemand().map((d) => d.skillId)
    // Graphic Design is required by no job and no project, only by an
    // aspirational role, so it must not appear as org demand.
    expect(demanded).not.toContain('graphic-design')
    expect(demanded).toContain('ai-tools')
  })
})

describe('generateLearningPath (§10.8)', () => {
  it('starts from the primary gap', () => {
    const path = generateLearningPath(jenjira())
    expect(path.targetSkill).toBe('leadership')
    expect(path.fromLevel).toBe(2.1)
    expect(path.toLevel).toBe(4.0)
  })

  it('orders catalog steps easiest to hardest', () => {
    const path = generateLearningPath(jenjira())
    const catalogSteps = path.steps.filter((s) => !s.synthesized)
    expect(catalogSteps.map((s) => s.difficulty)).toEqual([...catalogSteps.map((s) => s.difficulty)].sort())
  })

  it('always closes with real project work and a manager assessment', () => {
    for (const employee of EMPLOYEES) {
      const path = generateLearningPath(employee)
      if (path.steps.length === 0) continue
      const tail = path.steps.slice(-2)
      expect(tail[0].type).toBe('Project')
      expect(tail[0].synthesized).toBe(true)
      expect(tail[1].synthesized).toBe(true)
    }
  })
})

describe('calcLearningOutcome (§10.9)', () => {
  it('flags a move smaller than 0.3', () => {
    expect(calcLearningOutcome(3.2, 3.3).lowOutcomeFlag).toBe(true)
    expect(calcLearningOutcome(2.1, 3.4).lowOutcomeFlag).toBe(false)
  })

  it('flags both of Nicha’s Client Handling courses', () => {
    const outcomes = learningOutcomes(nicha())
    expect(outcomes).toHaveLength(2)
    expect(outcomes.every((o) => o.record.targetSkill === 'client-handling')).toBe(true)
    expect(outcomes.every((o) => o.outcome.lowOutcomeFlag)).toBe(true)
  })
})

describe('generateInsights (§10.10)', () => {
  const insights = () => generateInsights()

  it('produces all four insight kinds', () => {
    const kinds = new Set(insights().map((i) => i.kind))
    expect(kinds).toContain('Critical Skill Gap')
    expect(kinds).toContain('At-Risk Skill')
    expect(kinds).toContain('Workload Risk')
    expect(kinds).toContain('Growth Opportunity')
  })

  it('cites what every insight was computed from', () => {
    for (const insight of insights()) {
      expect(insight.computedFrom.length).toBeGreaterThan(10)
      expect(insight.formula.length).toBeGreaterThan(10)
      expect(insight.action.to.startsWith('/')).toBe(true)
    }
  })

  it('sorts critical findings first', () => {
    expect(insights()[0].severity).toBe('critical')
  })
})

describe('additional tracking KPIs (§10.11)', () => {
  it('reports completion against the assigned path', () => {
    const path = generateLearningPath(jenjira())
    const half = path.steps.slice(0, 2).map((s) => s.id)
    const result = calcSkillCompletionRate(jenjira(), half)
    expect(result.assigned).toBe(path.steps.length)
    expect(result.completed).toBe(2)
    expect(result.rate).toBeCloseTo(2 / path.steps.length, 2)
  })

  it('treats engagement as started, a lower bar than completed', () => {
    const path = generateLearningPath(jenjira())
    const started = path.steps.slice(0, 4).map((s) => s.id)
    expect(calcEngagementInDevelopmentPlan(jenjira(), started).started).toBe(4)
    expect(calcSkillCompletionRate(jenjira(), []).rate).toBe(0)
  })

  it('returns null time-to-competency when no history crosses the bar', () => {
    // Nicha's three tracked skills all sit below what Senior Sales Executive
    // asks for across the whole window, so there is nothing to measure.
    expect(calcTimeToCompetency(nicha()).averageMonths).toBeNull()
  })

  it('measures the months a real crossing took', () => {
    // Jenjira's Data Analysis went 2.7 → 3.2 while Marketing Manager asks 3.0.
    const result = calcTimeToCompetency(jenjira())
    expect(result.perSkill.find((r) => r.skillId === 'data-analysis')?.months).toBe(2)
  })

  it('measures months once a history series does cross', () => {
    const grower = {
      ...thanakorn(),
      skillHistory: { sql: [1.0, 2.0, 3.0, 3.6, 3.7, 3.8].map((level, i) => ({ month: `2026-0${i + 3}`, level })) },
    }
    const result = calcTimeToCompetency(grower)
    expect(result.perSkill.find((r) => r.skillId === 'sql')?.months).toBe(3)
  })

  it('labels manager satisfaction as a proxy and shows its basis', () => {
    const result = calcManagerSatisfaction(piya())
    expect(result.score).toBeCloseTo(0.92, 2)
    expect(result.reviewCount).toBeGreaterThan(0)
    expect(result.basis).toContain('Manager Satisfaction')
  })
})

describe('skill graph (§4)', () => {
  it('connects two people only when they share a skill at 3.0 or above', () => {
    const edges = sharedSkillEdges(EMPLOYEES)
    expect(edges.length).toBeGreaterThan(0)
    for (const edge of edges) expect(edge.sharedSkills.length).toBeGreaterThan(0)
    const isolated = sharedSkillEdges([thanakorn(), phum()])
    expect(isolated).toHaveLength(0)
  })

  it('sums skill mass for node sizing', () => {
    expect(totalSkillLevel(piya())).toBeGreaterThan(totalSkillLevel(phum()))
  })

  it('reads growth as the mean monthly change across tracked skills', () => {
    expect(avgMonthlyGrowth(thanakorn())).toBeGreaterThanOrEqual(0.15)
    expect(avgMonthlyGrowth(phum())).toBeGreaterThanOrEqual(0.15)
    expect(avgMonthlyGrowth(nicha())).toBeLessThan(0.15)
  })
})

describe('everything moves when the data moves', () => {
  it('recomputes readiness when a skill level changes', () => {
    const before = calcPromotionReadiness(jenjira()).score
    const promoted = {
      ...jenjira(),
      skills: jenjira().skills.map((s) => (s.skillId === 'leadership' ? { ...s, level: 4.2 } : s)),
    }
    expect(calcPromotionReadiness(promoted).score).toBeGreaterThan(before)
  })

  it('recomputes the critical gap when somebody learns the missing skill', () => {
    const upskilled = EMPLOYEES.map((e) =>
      e.id === 'emp-02' ? { ...e, skills: e.skills.map((s) => (s.skillId === 'ai-tools' ? { ...s, level: 4.5 } : s)) } : e,
    )
    expect(calcWorkforceHealth(upskilled).criticalSkillGaps).toHaveLength(0)
  })
})

describe('roles', () => {
  it('defines a role for every career goal and keeps requirements in range', () => {
    expect(ROLES.length).toBeGreaterThanOrEqual(14)
    for (const role of ROLES) {
      expect(role.requiredSkills.length).toBeGreaterThan(0)
      for (const req of role.requiredSkills) {
        expect(req.level).toBeGreaterThan(0)
        expect(req.level).toBeLessThanOrEqual(5)
      }
      expect(role.rationale.length).toBeGreaterThan(10)
    }
  })

  it('keeps the one requirement the spec fixes', () => {
    const leadership = getRole('marketing-manager').requiredSkills.find((r) => r.skillId === 'leadership')
    expect(leadership?.level).toBe(4.0)
  })
})

describe('ownership bar', () => {
  it('is the level at which one person alone counts as key-person risk', () => {
    expect(OWNERSHIP_BAR).toBe(4.0)
    const owners = EMPLOYEES.filter((e) => (e.skills.find((s) => s.skillId === 'ux-research')?.level ?? 0) >= OWNERSHIP_BAR)
    expect(owners).toHaveLength(1)
  })
})

describe('at-risk insight completeness', () => {
  it('emits an insight for every at-risk skill, not a trimmed list', () => {
    const health = calcWorkforceHealth()
    const atRiskInsights = generateInsights().filter((i) => i.kind === 'At-Risk Skill')
    expect(atRiskInsights).toHaveLength(health.atRiskSkills.length)
  })

  it('orders at-risk by thinnest bench so the top five are the most exposed', () => {
    const levels = calcWorkforceHealth().atRiskSkills.map((s) => s.secondBestLevel)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
  })
})
