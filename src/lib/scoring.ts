/**
 * HRADA scoring engine.
 *
 * Every number rendered anywhere in the product is produced here. Screens read
 * these functions; they never carry a figure of their own. Change one skill
 * level in src/data and every dependent number moves with it.
 *
 * The product spec describes four logical AI engines. They map onto this file
 * as follows (§10.12):
 *
 *   Skill Intelligence Engine
 *     → the Employee Skill Graph: skillLevelOf, sharedSkillEdges,
 *       evidenceStrength, avgMonthlyGrowth
 *   Matching Engine
 *     → calcCandidateMatchScore, calcTeamFit, selectTeam
 *   Learning Engine
 *     → generateLearningPath, calcLearningOutcome, calcSkillCompletionRate,
 *       calcTimeToCompetency
 *   Workforce Intelligence Engine
 *     → calcWorkforceHealth, generateInsights, calcPromotionReadiness,
 *       classifyTalent
 *
 * Nothing here decides anything. Each function returns a number plus the
 * reasoning behind it, and a human acts on it (§12).
 */

import { CANDIDATES } from '@/data/candidates'
import { EMPLOYEES, skillLevel } from '@/data/employees'
import { JOBS } from '@/data/jobs'
import { LEARNING_CATALOG } from '@/data/learningCatalog'
import { PROJECTS } from '@/data/projects'
import { getRole, ROLES } from '@/data/roles'
import { SKILLS, skillCategory, skillName } from '@/data/skills'
import type {
  Candidate,
  Employee,
  Job,
  LearningItem,
  ProjectSpec,
  RoleDefinition,
  SkillId,
  TalentType,
} from '@/data/types'

/**
 * The level at which a person can set the standard for a skill and teach it
 * (§7 — the top of Proficient). Org-wide "who actually owns this skill"
 * questions are answered against this bar.
 */
export const OWNERSHIP_BAR = 4.0

/** Below this monthly rate, growth is noise rather than a trend (§10.5). */
export const GROWTH_TREND_PER_MONTH = 0.15

/** Promotion readiness at or above this counts as High Potential (§10.7). */
export const HIGH_POTENTIAL_THRESHOLD = 0.75

/** A learning activity that moves a level less than this has not landed (§10.9). */
export const LOW_OUTCOME_DELTA = 0.3

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// ───────────────────────────────────────────────────────────── skill graph ──

export function skillLevelOf(employee: Employee, skillId: SkillId): number {
  return skillLevel(employee, skillId)
}

/** How many independent sources back a skill claim (§9.3). */
export function evidenceStrength(employee: Employee, skillId: SkillId): number {
  return employee.skills.find((s) => s.skillId === skillId)?.evidence.length ?? 0
}

/**
 * Average monthly change across everything we have history for. Used as the
 * growth-trend signal in classifyTalent. Six monthly points give five
 * intervals, so the divisor is points-1, not points.
 */
export function avgMonthlyGrowth(employee: Employee): number {
  const series = Object.values(employee.skillHistory).filter(
    (points): points is NonNullable<typeof points> => Boolean(points && points.length > 1),
  )
  if (series.length === 0) return 0
  const rates = series.map((points) => {
    const first = points[0].level
    const last = points[points.length - 1].level
    return (last - first) / (points.length - 1)
  })
  return round2(rates.reduce((a, b) => a + b, 0) / rates.length)
}

export interface SkillEdge {
  a: string
  b: string
  /** Skills both people hold at 3.0 or better. */
  sharedSkills: SkillId[]
}

/**
 * §4 — two people are connected when they share a skill at level 3.0 or above.
 * The constellation draws the thickness from sharedSkills.length.
 */
export function sharedSkillEdges(employees: Employee[], minLevel = 3.0): SkillEdge[] {
  const edges: SkillEdge[] = []
  for (let i = 0; i < employees.length; i++) {
    for (let j = i + 1; j < employees.length; j++) {
      const a = employees[i]
      const b = employees[j]
      const shared = SKILLS.filter(
        (s) => skillLevelOf(a, s.id) >= minLevel && skillLevelOf(b, s.id) >= minLevel,
      ).map((s) => s.id)
      if (shared.length > 0) edges.push({ a: a.id, b: b.id, sharedSkills: shared })
    }
  }
  return edges
}

/** Total skill mass — drives node size/brightness in the constellation. */
export function totalSkillLevel(employee: Employee): number {
  return round1(employee.skills.reduce((sum, s) => sum + s.level, 0))
}

// ─────────────────────────────────────────────────────────────── skill gap ──

export interface SkillGapItem {
  skillId: SkillId
  skillName: string
  required: number
  current: number
  gap: number
}

export interface SkillGapResult {
  roleId: string
  roleTitle: string
  gaps: SkillGapItem[]
  /** Largest gap, or null when the person already meets every requirement. */
  primaryGap: SkillGapItem | null
  metCount: number
  requiredCount: number
  /** Share of the role's requirements already met, 0–1. */
  pctMet: number
}

/**
 * §10.1 — gap = max(0, required − current) per required skill, sorted largest
 * first. Skills already at or above the bar stay in the list with gap 0 so the
 * UI can show the whole picture, but primaryGap only ever points at a real gap.
 */
export function calcSkillGap(employee: Employee, targetRole: RoleDefinition): SkillGapResult {
  const gaps: SkillGapItem[] = targetRole.requiredSkills
    .map((req) => {
      const current = skillLevelOf(employee, req.skillId)
      return {
        skillId: req.skillId,
        skillName: skillName(req.skillId),
        required: req.level,
        current,
        gap: round1(Math.max(0, req.level - current)),
      }
    })
    .sort((a, b) => b.gap - a.gap || a.skillName.localeCompare(b.skillName))

  const metCount = gaps.filter((g) => g.gap === 0).length
  return {
    roleId: targetRole.id,
    roleTitle: targetRole.title,
    gaps,
    primaryGap: gaps.find((g) => g.gap > 0) ?? null,
    metCount,
    requiredCount: gaps.length,
    pctMet: gaps.length === 0 ? 1 : metCount / gaps.length,
  }
}

export function targetRoleOf(employee: Employee): RoleDefinition {
  return getRole(employee.careerGoalRoleId)
}

// ──────────────────────────────────────────────────────── candidate match ──

export interface ScoreComponent {
  key: string
  label: string
  /** Points this component can contribute to the 100-point total. */
  weight: number
  /** Points actually earned, already scaled by weight. */
  earned: number
  /** The raw 0–1 ratio before weighting — shown in the explanation panel. */
  ratio: number
  detail: string
}

export interface CandidateMatchResult {
  candidateId: string
  jobId: string
  total: number
  components: ScoreComponent[]
  /** Any required skill more than 1.0 below the bar (§10.2). */
  hasCriticalGap: boolean
  criticalGaps: SkillGapItem[]
  requiredGaps: SkillGapItem[]
  strengths: SkillGapItem[]
}

const candidateLevel = (candidate: Candidate, skillId: SkillId) =>
  candidate.skills.find((s) => s.skillId === skillId)?.level ?? 0

/**
 * §10.2 — weighted to 100:
 *   Required Skills   50  avg(min(candidate/required, 1))
 *   Preferred Skills  15  same formula
 *   Experience        15  min(years / minExperience, 1)
 *   Project Relevance 10  share of the candidate's projects that touch a required skill
 *   Assessment        10  assessmentScore / 100
 *
 * A required skill more than 1.0 below the bar sets hasCriticalGap. That flag
 * is deliberately separate from the score: a high scorer can still be missing
 * something the job cannot do without, and the screen must say so rather than
 * bury it in an average.
 */
export function calcCandidateMatchScore(candidate: Candidate, job: Job): CandidateMatchResult {
  const requiredItems: SkillGapItem[] = job.requiredSkills.map((req) => {
    const current = candidateLevel(candidate, req.skillId)
    return {
      skillId: req.skillId,
      skillName: skillName(req.skillId),
      required: req.level,
      current,
      gap: round1(Math.max(0, req.level - current)),
    }
  })

  const requiredRatio =
    requiredItems.reduce((sum, r) => sum + Math.min(r.current / r.required, 1), 0) /
    (requiredItems.length || 1)

  const preferredItems: SkillGapItem[] = job.preferredSkills.map((req) => {
    const current = candidateLevel(candidate, req.skillId)
    return {
      skillId: req.skillId,
      skillName: skillName(req.skillId),
      required: req.level,
      current,
      gap: round1(Math.max(0, req.level - current)),
    }
  })
  const preferredRatio = preferredItems.length
    ? preferredItems.reduce((sum, r) => sum + Math.min(r.current / r.required, 1), 0) /
      preferredItems.length
    : 1

  const experienceRatio = clamp01(candidate.yearsExperience / job.minExperience)

  const requiredIds = new Set(job.requiredSkills.map((r) => r.skillId))
  const relevantProjects = candidate.projects.filter((p) =>
    p.skillsUsed.some((s) => requiredIds.has(s)),
  )
  const projectRatio = candidate.projects.length
    ? relevantProjects.length / candidate.projects.length
    : 0

  const assessmentRatio = clamp01(candidate.assessmentScore / 100)

  const components: ScoreComponent[] = [
    {
      key: 'required',
      label: 'Required Skills',
      weight: 50,
      ratio: round2(requiredRatio),
      earned: round1(requiredRatio * 50),
      detail: requiredItems
        .map((r) => `${r.skillName} ${r.current.toFixed(1)}/${r.required.toFixed(1)}`)
        .join(' · '),
    },
    {
      key: 'preferred',
      label: 'Preferred Skills',
      weight: 15,
      ratio: round2(preferredRatio),
      earned: round1(preferredRatio * 15),
      detail: preferredItems.length
        ? preferredItems
            .map((r) => `${r.skillName} ${r.current.toFixed(1)}/${r.required.toFixed(1)}`)
            .join(' · ')
        : 'ตำแหน่งนี้ไม่ได้ระบุ preferred skills',
    },
    {
      key: 'experience',
      label: 'Experience',
      weight: 15,
      ratio: round2(experienceRatio),
      earned: round1(experienceRatio * 15),
      detail: `${candidate.yearsExperience} ปี จากที่ต้องการอย่างน้อย ${job.minExperience} ปี`,
    },
    {
      key: 'projects',
      label: 'Project Relevance',
      weight: 10,
      ratio: round2(projectRatio),
      earned: round1(projectRatio * 10),
      detail: `${relevantProjects.length} จาก ${candidate.projects.length} โครงการ ใช้ skill ที่ตำแหน่งนี้ต้องการ`,
    },
    {
      key: 'assessment',
      label: 'Assessment',
      weight: 10,
      ratio: round2(assessmentRatio),
      earned: round1(assessmentRatio * 10),
      detail: `คะแนนแบบทดสอบ ${candidate.assessmentScore}/100`,
    },
  ]

  const criticalGaps = requiredItems.filter((r) => r.gap > 1.0)

  return {
    candidateId: candidate.id,
    jobId: job.id,
    total: round1(components.reduce((sum, c) => sum + c.earned, 0)),
    components,
    hasCriticalGap: criticalGaps.length > 0,
    criticalGaps,
    requiredGaps: requiredItems.filter((r) => r.gap > 0),
    strengths: requiredItems
      .filter((r) => r.gap === 0)
      .sort((a, b) => b.current - a.current),
  }
}

export function rankCandidates(job: Job, candidates: Candidate[] = CANDIDATES) {
  return candidates
    .filter((c) => c.appliedJobId === job.id)
    .map((candidate) => ({ candidate, match: calcCandidateMatchScore(candidate, job) }))
    .sort((a, b) => b.match.total - a.match.total)
}

// ───────────────────────────────────────────────────────────────  team fit ──

export interface TeamFitResult {
  employeeId: string
  projectId: string
  total: number
  components: ScoreComponent[]
  /** Required skills this person already meets — what they bring on day one. */
  brings: SkillGapItem[]
}

/**
 * §10.3 — Skill Contribution 50 + Availability 20 + Performance 15 +
 * Project History 15. Availability is (100 − workload)/100, so somebody at
 * 92% capacity scores 0.08 there no matter how skilled they are.
 */
export function calcTeamFit(employee: Employee, project: ProjectSpec): TeamFitResult {
  const skillItems: SkillGapItem[] = project.requiredSkills.map((req) => {
    const current = skillLevelOf(employee, req.skillId)
    return {
      skillId: req.skillId,
      skillName: skillName(req.skillId),
      required: req.level,
      current,
      gap: round1(Math.max(0, req.level - current)),
    }
  })

  const skillRatio =
    skillItems.reduce((sum, r) => sum + Math.min(r.current / r.required, 1), 0) /
    (skillItems.length || 1)
  const availabilityRatio = clamp01((100 - employee.workload) / 100)
  const performanceRatio = clamp01(employee.performance / 5)

  const requiredIds = new Set(project.requiredSkills.map((r) => r.skillId))
  const relevant = employee.projects.filter((p) => p.skillsUsed.some((s) => requiredIds.has(s)))
  const historyRatio = employee.projects.length ? relevant.length / employee.projects.length : 0

  const components: ScoreComponent[] = [
    {
      key: 'skill',
      label: 'Skill Contribution',
      weight: 50,
      ratio: round2(skillRatio),
      earned: round1(skillRatio * 50),
      detail: skillItems
        .map((r) => `${r.skillName} ${r.current.toFixed(1)}/${r.required.toFixed(1)}`)
        .join(' · '),
    },
    {
      key: 'availability',
      label: 'Availability',
      weight: 20,
      ratio: round2(availabilityRatio),
      earned: round1(availabilityRatio * 20),
      detail: `Workload ปัจจุบัน ${employee.workload}% เหลือกำลัง ${100 - employee.workload}%`,
    },
    {
      key: 'performance',
      label: 'Performance',
      weight: 15,
      ratio: round2(performanceRatio),
      earned: round1(performanceRatio * 15),
      detail: `ผลงานล่าสุด ${employee.performance.toFixed(1)}/5.0`,
    },
    {
      key: 'history',
      label: 'Project History',
      weight: 15,
      ratio: round2(historyRatio),
      earned: round1(historyRatio * 15),
      detail: `${relevant.length} จาก ${employee.projects.length} โครงการที่ผ่านมา ใช้ skill ของโครงการนี้`,
    },
  ]

  return {
    employeeId: employee.id,
    projectId: project.id,
    total: round1(components.reduce((sum, c) => sum + c.earned, 0)),
    components,
    brings: skillItems.filter((r) => r.gap === 0),
  }
}

// ────────────────────────────────────────────────────────── team selection ──

export interface TeamMember {
  employee: Employee
  fit: TeamFitResult
  talent: TalentClassification
  /** Why this person was picked, in the order the algorithm picked them. */
  reason: string
  /** Skills they were selected to cover. */
  covers: SkillId[]
  workloadRisk: boolean
  backupName?: string
}

export interface TeamSelection {
  projectId: string
  members: TeamMember[]
  /** Required skills nobody on the team meets — feeds straight into Recruit. */
  teamGaps: SkillGapItem[]
  /** Set when a Developing Talent was swapped in to satisfy the §10.4 rule. */
  developingTalentSwap?: { swappedOut: string; swappedIn: string; reason: string }
  steps: string[]
}

/**
 * §10.4 — greedy coverage, never top-N by score.
 *
 * The distinction matters: the three highest individual fits on this dataset
 * are often the same profile, which leaves half the project's skills
 * unstaffed. Greedy coverage picks whoever closes the most open requirements,
 * so the team is complementary rather than uniformly strong.
 */
export function selectTeam(
  project: ProjectSpec,
  employees: Employee[] = EMPLOYEES,
  teamSize: number = project.teamSize,
): TeamSelection {
  const steps: string[] = []
  const pool = employees.map((employee) => ({
    employee,
    fit: calcTeamFit(employee, project),
  }))

  let uncovered = project.requiredSkills.map((r) => ({ ...r }))
  const picked: TeamMember[] = []
  steps.push(
    `เริ่มจาก required skills ที่ยังไม่มีคนรับผิดชอบ ${uncovered.length} รายการ: ${uncovered
      .map((u) => skillName(u.skillId))
      .join(', ')}`,
  )

  // 1–2. Cover as many open requirements as possible, one person at a time.
  while (picked.length < teamSize && uncovered.length > 0) {
    const remaining = pool.filter((p) => !picked.some((m) => m.employee.id === p.employee.id))
    const scored = remaining.map((p) => ({
      ...p,
      covers: uncovered
        .filter((u) => skillLevelOf(p.employee, u.skillId) >= u.level)
        .map((u) => u.skillId),
    }))
    const best = scored
      .filter((s) => s.covers.length > 0)
      .sort((a, b) => b.covers.length - a.covers.length || b.fit.total - a.fit.total)[0]
    if (!best) {
      steps.push('ไม่มีใครในองค์กรครอบคลุม skill ที่เหลือได้อีก จึงหยุดขั้นตอน coverage')
      break
    }
    picked.push({
      employee: best.employee,
      fit: best.fit,
      talent: classifyTalent(best.employee),
      covers: best.covers,
      reason: `ครอบคลุม ${best.covers.length} skill ที่ยังขาด (${best.covers
        .map(skillName)
        .join(', ')}) และมี Fit ${best.fit.total.toFixed(1)}%`,
      workloadRisk: best.employee.workload > 90,
    })
    steps.push(
      `เลือก ${best.employee.name} เพราะปิดได้ ${best.covers.length} skill: ${best.covers
        .map(skillName)
        .join(', ')}`,
    )
    uncovered = uncovered.filter((u) => !best.covers.includes(u.skillId))
  }

  // 3. Any slot left over goes to the best fit who still has real capacity.
  if (picked.length < teamSize) {
    const remaining = pool
      .filter((p) => !picked.some((m) => m.employee.id === p.employee.id))
      .filter((p) => 100 - p.employee.workload > 20)
      .sort((a, b) => b.fit.total - a.fit.total)
    for (const p of remaining) {
      if (picked.length >= teamSize) break
      picked.push({
        employee: p.employee,
        fit: p.fit,
        talent: classifyTalent(p.employee),
        covers: [],
        reason: `เติมทีมด้วยคนที่ Fit สูงสุดในกลุ่มที่ยังมีกำลังเหลือมากกว่า 20% (Fit ${p.fit.total.toFixed(1)}%)`,
        workloadRisk: p.employee.workload > 90,
      })
      steps.push(`เติม ${p.employee.name} จาก Fit ${p.fit.total.toFixed(1)}% และยังมีกำลังเหลือ`)
    }
  }

  // 4. A team of four or more must carry someone who is still growing.
  let swap: TeamSelection['developingTalentSwap']
  if (picked.length >= 4 && !picked.some((m) => m.talent.type === 'Developing Talent')) {
    const candidatesForSwap = pool
      .filter((p) => !picked.some((m) => m.employee.id === p.employee.id))
      .filter((p) => classifyTalent(p.employee).type === 'Developing Talent')
      .sort((a, b) => b.fit.total - a.fit.total)
    const incoming = candidatesForSwap[0]
    if (incoming) {
      const outgoing = [...picked].sort((a, b) => a.fit.total - b.fit.total)[0]
      // Never drop somebody who is the only cover for a required skill.
      const outgoingIsLoadBearing = outgoing.covers.some(
        (skillId) => !picked.some((m) => m !== outgoing && m.covers.includes(skillId)),
      )
      if (!outgoingIsLoadBearing) {
        const index = picked.indexOf(outgoing)
        picked[index] = {
          employee: incoming.employee,
          fit: incoming.fit,
          talent: classifyTalent(incoming.employee),
          covers: [],
          reason: `ทีมขนาด ${picked.length} คนต้องมี Developing Talent อย่างน้อย 1 คน จึงสลับเข้ามาแทนคนที่ Fit ต่ำสุดและไม่ได้ถือ skill สำคัญไว้คนเดียว`,
          workloadRisk: incoming.employee.workload > 90,
        }
        swap = {
          swappedOut: outgoing.employee.name,
          swappedIn: incoming.employee.name,
          reason: `ทีมตั้งแต่ 4 คนขึ้นไปต้องมี Developing Talent เพื่อให้โครงการสร้างคนไปด้วย จึงสลับ ${outgoing.employee.name} (Fit ${outgoing.fit.total.toFixed(1)}%) ออก และให้ ${incoming.employee.name} เข้ามาแทน`,
        }
        steps.push(swap.reason)
      }
    }
  }

  // 5. Flag anyone already over 90% and name who could take the load instead.
  for (const member of picked) {
    if (!member.workloadRisk) continue
    const backup = pool
      .filter((p) => !picked.some((m) => m.employee.id === p.employee.id))
      .filter((p) => p.employee.workload <= 85)
      .sort((a, b) => b.fit.total - a.fit.total)[0]
    member.backupName = backup?.employee.name
  }

  // 6. Whatever the team still cannot do becomes a hiring signal.
  const teamGaps: SkillGapItem[] = project.requiredSkills
    .map((req) => {
      const best = Math.max(0, ...picked.map((m) => skillLevelOf(m.employee, req.skillId)))
      return {
        skillId: req.skillId,
        skillName: skillName(req.skillId),
        required: req.level,
        current: best,
        gap: round1(Math.max(0, req.level - best)),
      }
    })
    .filter((g) => g.gap > 0)

  if (teamGaps.length > 0) {
    steps.push(
      `ทีมนี้ยังไม่ถึงเกณฑ์ใน ${teamGaps.map((g) => g.skillName).join(', ')} — ต้องตัดสินใจว่าจะพัฒนาคนในทีมหรือเปิดรับสมัคร`,
    )
  }

  return { projectId: project.id, members: picked, teamGaps, developingTalentSwap: swap, steps }
}

// ─────────────────────────────────────────────────────── talent classifier ──

export interface TalentClassification {
  type: TalentType
  /** 0–1 confidence, used only to break ties between qualifying types. */
  score: number
  reason: string
  /**
   * False when the person met none of the three sets of criteria. The label
   * still reads Developing Talent, but the UI shows it muted and says why —
   * inventing a category for somebody the rules do not cover would be worse
   * than admitting the rules did not fire.
   */
  qualified: boolean
  /** Every type the person qualifies for, strongest first. */
  qualifiesFor: { type: TalentType; score: number; reason: string }[]
}

/**
 * §10.5 — criteria only. There is no "top 30%" rule anywhere in this function:
 * a person is a Core Expert because of what they can evidence, not because of
 * where they land in a ranking of their colleagues.
 */
export function classifyTalent(employee: Employee): TalentClassification {
  const qualifying: { type: TalentType; score: number; reason: string }[] = []

  // Core Expert — a deeply evidenced peak skill plus sustained performance.
  const expertSkills = employee.skills.filter(
    (s) => s.level >= 4.3 && s.evidence.length >= 2,
  )
  const peak = expertSkills.sort((a, b) => b.level - a.level)[0]
  if (peak && employee.performance >= 4.0) {
    qualifying.push({
      type: 'Core Expert',
      score: round2(0.6 + 0.4 * clamp01((peak.level - 4.3) / 0.7)),
      reason: `${skillName(peak.skillId)} อยู่ที่ ${peak.level.toFixed(1)} มีหลักฐานรองรับ ${peak.evidence.length} แหล่ง และผลงาน ${employee.performance.toFixed(1)}/5.0`,
    })
  }

  // Bridge Member — reach across domains, or across departments.
  const spreadCategories = new Set(
    employee.skills.filter((s) => s.level >= 3.2).map((s) => skillCategory(s.skillId)),
  )
  const crossDeptProjects = employee.projects.filter((p) => p.crossDepartment).length
  if (spreadCategories.size >= 3 || crossDeptProjects >= 2) {
    // Breadth is weighted above reach on purpose. Somebody whose skills all
    // sit in one category is not a bridge just because two of their projects
    // happened to involve another team.
    const breadth = clamp01((spreadCategories.size - 2) / 3)
    const reach = clamp01((crossDeptProjects - 1) / 3)
    qualifying.push({
      type: 'Bridge Member',
      score: round2(0.5 + 0.5 * clamp01(breadth * 0.6 + reach * 0.4)),
      reason: `มี skill ระดับ 3.2 ขึ้นไปใน ${spreadCategories.size} หมวด และเคยทำโครงการข้ามแผนก ${crossDeptProjects} โครงการ`,
    })
  }

  // Developing Talent — a real gap ahead, and a real slope behind.
  const gap = calcSkillGap(employee, targetRoleOf(employee))
  const growth = avgMonthlyGrowth(employee)
  if (gap.primaryGap && growth >= GROWTH_TREND_PER_MONTH) {
    qualifying.push({
      type: 'Developing Talent',
      score: round2(0.5 + 0.5 * clamp01((growth - GROWTH_TREND_PER_MONTH) / 0.25)),
      reason: `ยังมี gap ไปสู่ ${gap.roleTitle} (${gap.primaryGap.skillName} ขาด ${gap.primaryGap.gap.toFixed(1)}) และโตเฉลี่ย +${growth.toFixed(2)} ระดับต่อเดือนใน 6 เดือนล่าสุด`,
    })
  }

  qualifying.sort((a, b) => b.score - a.score)

  if (qualifying.length === 0) {
    return {
      type: 'Developing Talent',
      score: 0,
      reason: `ยังไม่เข้าเกณฑ์ Core Expert หรือ Bridge Member และอัตราการเติบโตเฉลี่ย +${growth.toFixed(2)} ต่อเดือน ยังต่ำกว่าเกณฑ์ ${GROWTH_TREND_PER_MONTH}`,
      qualified: false,
      qualifiesFor: [],
    }
  }

  return { ...qualifying[0], qualified: true, qualifiesFor: qualifying }
}

// ───────────────────────────────────────────────────── promotion readiness ──

export interface PromotionReadinessResult {
  employeeId: string
  roleTitle: string
  /** 0–1. */
  score: number
  components: ScoreComponent[]
  missingSkills: SkillGapItem[]
  isHighPotential: boolean
}

/**
 * §10.6 — (share of the target role's requirements met × 0.7)
 *       + (performance / 5 × 0.2)
 *       + (min(years in current role / 3, 1) × 0.1)
 */
export function calcPromotionReadiness(employee: Employee): PromotionReadinessResult {
  const role = targetRoleOf(employee)
  const gap = calcSkillGap(employee, role)
  const tenureRatio = clamp01(employee.yearsInRole / 3)

  const components: ScoreComponent[] = [
    {
      key: 'skills',
      label: 'Required skills met',
      weight: 70,
      ratio: round2(gap.pctMet),
      earned: round1(gap.pctMet * 70),
      detail: `ผ่านเกณฑ์ ${gap.metCount} จาก ${gap.requiredCount} skill ที่ ${role.title} ต้องการ`,
    },
    {
      key: 'performance',
      label: 'Performance',
      weight: 20,
      ratio: round2(employee.performance / 5),
      earned: round1((employee.performance / 5) * 20),
      detail: `ผลงานล่าสุด ${employee.performance.toFixed(1)}/5.0`,
    },
    {
      key: 'tenure',
      label: 'Time in role',
      weight: 10,
      ratio: round2(tenureRatio),
      earned: round1(tenureRatio * 10),
      detail: `อยู่ในตำแหน่งปัจจุบัน ${employee.yearsInRole} ปี (นับเต็มที่ 3 ปี)`,
    },
  ]

  const score = round2(components.reduce((sum, c) => sum + c.earned, 0) / 100)

  return {
    employeeId: employee.id,
    roleTitle: role.title,
    score,
    components,
    missingSkills: gap.gaps.filter((g) => g.gap > 0),
    isHighPotential: score >= HIGH_POTENTIAL_THRESHOLD,
  }
}

// ────────────────────────────────────────────────────────── workforce health ──

/**
 * What the business has actually committed to deliver: open jobs and active
 * projects. A role somebody hopes to grow into is not org demand, so
 * src/data/roles.ts deliberately does not feed this.
 */
export interface SkillDemand {
  skillId: SkillId
  skillName: string
  /** Highest level any open job or active project asks for. */
  requiredLevel: number
  sources: string[]
  /** People at or above requiredLevel. */
  meetingCount: number
  meetingNames: string[]
}

export function skillDemand(
  employees: Employee[] = EMPLOYEES,
  jobs: Job[] = JOBS,
  projects: ProjectSpec[] = PROJECTS,
): SkillDemand[] {
  const demand = new Map<SkillId, { level: number; sources: string[] }>()
  const add = (skillId: SkillId, level: number, source: string) => {
    const existing = demand.get(skillId)
    if (!existing) demand.set(skillId, { level, sources: [source] })
    else {
      existing.level = Math.max(existing.level, level)
      if (!existing.sources.includes(source)) existing.sources.push(source)
    }
  }
  for (const job of jobs) {
    for (const r of job.requiredSkills) add(r.skillId, r.level, `ตำแหน่งเปิดรับ: ${job.title}`)
    for (const r of job.preferredSkills) add(r.skillId, r.level, `ตำแหน่งเปิดรับ: ${job.title}`)
  }
  for (const project of projects) {
    for (const r of project.requiredSkills) add(r.skillId, r.level, `โครงการ: ${project.name}`)
  }

  return [...demand.entries()]
    .map(([skillId, { level, sources }]) => {
      const meeting = employees.filter((e) => skillLevelOf(e, skillId) >= level)
      return {
        skillId,
        skillName: skillName(skillId),
        requiredLevel: level,
        sources,
        meetingCount: meeting.length,
        meetingNames: meeting.map((e) => e.name),
      }
    })
    .sort((a, b) => a.meetingCount - b.meetingCount || a.skillName.localeCompare(b.skillName))
}

export interface AtRiskSkill {
  skillId: SkillId
  skillName: string
  ownerName: string
  ownerId: string
  ownerLevel: number
  /** Best level held by anybody else — how thin the bench is. */
  secondBestLevel: number
  secondBestName: string | null
}

export interface WorkforceHealth {
  headcount: number
  /** Share of demanded skills with at least two people at the demanded level. */
  skillCoverage: number
  coveredSkills: SkillDemand[]
  criticalSkillGaps: SkillDemand[]
  atRiskSkills: AtRiskSkill[]
  highPotential: { employee: Employee; readiness: PromotionReadinessResult }[]
  workloadRisk: Employee[]
  internalMobility: { employee: Employee; role: RoleDefinition; pctMet: number }[]
  internalMobilityRate: number
  demand: SkillDemand[]
}

/**
 * §10.7, with one deviation from the literal wording, made deliberately.
 *
 * The spec defines Critical Skill Gap as "fewer than 2 people meet the bar"
 * and At-Risk Skill as "exactly 1 person meets the bar". Those overlap: every
 * at-risk skill would also be critical, and §9.4 expects them to name
 * different skills. They are separated here by asking two different questions:
 *
 *   Critical  — the business has committed to work needing this skill and
 *               NOBODY can do it at the level committed. A hiring problem.
 *   At-Risk   — exactly one person in the company owns this skill at
 *               OWNERSHIP_BAR. A key-person problem, whether or not there is
 *               open work for it right now.
 *
 * The two sets cannot intersect: critical means zero owners, at-risk means one.
 */
export function calcWorkforceHealth(employees: Employee[] = EMPLOYEES): WorkforceHealth {
  const demand = skillDemand(employees)
  const criticalSkillGaps = demand.filter((d) => d.meetingCount === 0)
  const coveredSkills = demand.filter((d) => d.meetingCount >= 2)

  const atRiskSkills: AtRiskSkill[] = SKILLS.map((skill) => {
    const owners = employees
      .filter((e) => skillLevelOf(e, skill.id) >= OWNERSHIP_BAR)
      .sort((a, b) => skillLevelOf(b, skill.id) - skillLevelOf(a, skill.id))
    if (owners.length !== 1) return null
    const owner = owners[0]
    const bench = employees
      .filter((e) => e.id !== owner.id)
      .sort((a, b) => skillLevelOf(b, skill.id) - skillLevelOf(a, skill.id))[0]
    return {
      skillId: skill.id,
      skillName: skill.name,
      ownerName: owner.name,
      ownerId: owner.id,
      ownerLevel: skillLevelOf(owner, skill.id),
      secondBestLevel: bench ? skillLevelOf(bench, skill.id) : 0,
      secondBestName: bench ? bench.name : null,
    }
  })
    .filter((s): s is AtRiskSkill => s !== null)
    // Thinnest bench first — that is where losing one person hurts most.
    .sort((a, b) => a.secondBestLevel - b.secondBestLevel)

  const highPotential = employees
    .map((employee) => ({ employee, readiness: calcPromotionReadiness(employee) }))
    .filter((r) => r.readiness.isHighPotential)
    .sort((a, b) => b.readiness.score - a.readiness.score)

  const workloadRisk = employees
    .filter((e) => e.workload > 85 && e.performance >= 4.0)
    .sort((a, b) => b.workload - a.workload)

  // Internal Mobility — people who already meet 70% of a different role here.
  //
  // Roles the person has comfortably outgrown are filtered out: a Data Lead
  // "qualifying" for Junior Data Analyst is arithmetically true and useless as
  // a mobility signal, so a fully-met role with an average surplus of half a
  // level or more does not count as somewhere to move.
  const internalMobility = employees
    .map((employee) => {
      const options = ROLES.filter((role) => role.title !== employee.title)
        .map((role) => {
          const gap = calcSkillGap(employee, role)
          const surplus =
            gap.gaps.reduce((sum, g) => sum + (g.current - g.required), 0) /
            (gap.gaps.length || 1)
          return { role, pctMet: gap.pctMet, surplus }
        })
        .filter((o) => o.pctMet >= 0.7)
        .filter((o) => !(o.pctMet === 1 && o.surplus >= 0.5))
        .sort((a, b) => b.pctMet - a.pctMet)
      return options[0]
        ? { employee, role: options[0].role, pctMet: options[0].pctMet }
        : null
    })
    .filter((m): m is { employee: Employee; role: RoleDefinition; pctMet: number } => m !== null)
    .sort((a, b) => b.pctMet - a.pctMet)

  return {
    headcount: employees.length,
    skillCoverage: demand.length ? round2(coveredSkills.length / demand.length) : 0,
    coveredSkills,
    criticalSkillGaps,
    atRiskSkills,
    highPotential,
    workloadRisk,
    internalMobility,
    internalMobilityRate: employees.length
      ? round2(internalMobility.length / employees.length)
      : 0,
    demand,
  }
}

/** Skill coverage per department — the Dashboard bar chart (§11 Screen 2). */
export function skillCoverageByDepartment(employees: Employee[] = EMPLOYEES) {
  const demand = skillDemand(employees)
  const departments = [...new Set(employees.map((e) => e.department))]
  return departments
    .map((department) => {
      const people = employees.filter((e) => e.department === department)
      const covered = demand.filter((d) =>
        people.some((e) => skillLevelOf(e, d.skillId) >= d.requiredLevel),
      )
      return {
        department,
        headcount: people.length,
        coverage: demand.length ? round2(covered.length / demand.length) : 0,
        coveredCount: covered.length,
        demandCount: demand.length,
      }
    })
    .sort((a, b) => b.coverage - a.coverage)
}

// ──────────────────────────────────────────────────────────────── learning ──

export interface LearningStep {
  id: string
  title: string
  type: LearningItem['type']
  targetSkill: SkillId
  difficulty: number
  durationHours: number
  /** True for the two closing steps the method always appends. */
  synthesized: boolean
  rationale: string
}

export interface LearningPath {
  employeeId: string
  targetSkill: SkillId | null
  targetSkillName: string | null
  fromLevel: number
  toLevel: number
  steps: LearningStep[]
  /** Why the path ends the way it does — shown in the UI (§10.8). */
  method: string
}

/**
 * §10.8 — start from the primary gap, take the catalog items that target that
 * skill easiest-first, then always close with real project work and a manager
 * assessment. Courses alone move a level a little; applying the skill on real
 * work and having it checked is what moves it for good. Nicha's flat Client
 * Handling line (§9.4 case 6) is exactly this failure.
 */
export function generateLearningPath(
  employee: Employee,
  catalog: LearningItem[] = LEARNING_CATALOG,
): LearningPath {
  const role = targetRoleOf(employee)
  const gap = calcSkillGap(employee, role)
  const primary = gap.primaryGap

  const method =
    'เรียงจากง่ายไปยาก แล้วปิดท้ายด้วยงานจริงและการประเมินจากหัวหน้าเสมอ เพราะ skill จะขยับจริงตอนได้ใช้กับงานจริง ไม่ใช่ตอนเรียนจบ'

  if (!primary) {
    return {
      employeeId: employee.id,
      targetSkill: null,
      targetSkillName: null,
      fromLevel: 0,
      toLevel: 0,
      steps: [],
      method,
    }
  }

  const matching = catalog
    .filter((item) => item.targetSkill === primary.skillId)
    .sort((a, b) => a.difficulty - b.difficulty || a.durationHours - b.durationHours)

  const steps: LearningStep[] = matching.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    targetSkill: item.targetSkill,
    difficulty: item.difficulty,
    durationHours: item.durationHours,
    synthesized: false,
    rationale: `ระดับความยาก ${item.difficulty}/3 ตรงกับ ${primary.skillName} ที่ยังขาดอยู่ ${primary.gap.toFixed(1)} ระดับ`,
  }))

  steps.push(
    {
      id: `${employee.id}-real-project`,
      title: `รับผิดชอบงานจริงที่ต้องใช้ ${primary.skillName}`,
      type: 'Project',
      targetSkill: primary.skillId,
      difficulty: 3,
      durationHours: 40,
      synthesized: true,
      rationale: 'ขั้นนี้บังคับเสมอ — ถ้าไม่ได้ใช้กับงานจริง ระดับ skill มักไม่ขยับ',
    },
    {
      id: `${employee.id}-manager-assessment`,
      title: `ให้หัวหน้าประเมิน ${primary.skillName} อีกครั้ง`,
      type: 'On-the-job',
      targetSkill: primary.skillId,
      difficulty: 1,
      durationHours: 2,
      synthesized: true,
      rationale: 'ปิดวงจรด้วยหลักฐานใหม่ เพื่อให้ระดับที่บันทึกไว้ตรงกับความสามารถจริง',
    },
  )

  return {
    employeeId: employee.id,
    targetSkill: primary.skillId,
    targetSkillName: primary.skillName,
    fromLevel: primary.current,
    toLevel: primary.required,
    steps,
    method,
  }
}

export interface LearningOutcome {
  before: number
  after: number
  delta: number
  lowOutcomeFlag: boolean
  message: string
}

/** §10.9 — a move smaller than 0.3 has not produced anything measurable yet. */
export function calcLearningOutcome(before: number, after: number): LearningOutcome {
  const delta = round1(after - before)
  const lowOutcomeFlag = delta < LOW_OUTCOME_DELTA
  return {
    before,
    after,
    delta,
    lowOutcomeFlag,
    message: lowOutcomeFlag
      ? `ขยับขึ้นเพียง ${delta.toFixed(1)} ระดับ — การเรียนนี้ยังไม่เห็นผลที่วัดได้ ลองจับคู่กับงานจริงหรือ mentorship`
      : `ขยับขึ้น ${delta.toFixed(1)} ระดับ — การเรียนนี้เห็นผลที่วัดได้`,
  }
}

/** The learning records for one person, each scored by calcLearningOutcome. */
export function learningOutcomes(employee: Employee) {
  return employee.learningHistory.map((record) => ({
    record,
    outcome: calcLearningOutcome(record.levelBefore, record.levelAfter),
  }))
}

// ───────────────────────────────────────────── §10.11 additional tracking KPIs ──

/**
 * §10.11 — share of assigned Learning Path steps marked complete.
 *
 * The spec signature is calcSkillCompletionRate(employee); completion is user
 * state rather than mock data, so the checked ids are passed in from the
 * Zustand store instead of being invented here.
 */
export function calcSkillCompletionRate(employee: Employee, completedStepIds: string[]) {
  const path = generateLearningPath(employee)
  const assigned = path.steps.length
  const completed = path.steps.filter((s) => completedStepIds.includes(s.id)).length
  return {
    assigned,
    completed,
    rate: assigned ? round2(completed / assigned) : 0,
  }
}

/**
 * §10.11 — "Employee Engagement in Development Plan": share of assigned steps
 * started, which is a lower bar than completed and catches plans that were
 * opened and abandoned.
 */
export function calcEngagementInDevelopmentPlan(employee: Employee, startedStepIds: string[]) {
  const path = generateLearningPath(employee)
  const assigned = path.steps.length
  const started = path.steps.filter((s) => startedStepIds.includes(s.id)).length
  return {
    assigned,
    started,
    rate: assigned ? round2(started / assigned) : 0,
  }
}

/**
 * §10.11 — months taken to close a primary-gap skill, approximated from the
 * first and last history points that cross the required threshold.
 *
 * On this dataset the answer is usually null: a primary gap is by definition
 * still open, so the series never crosses. The UI says "ยังวัดไม่ได้" rather
 * than showing an invented number.
 */
export function calcTimeToCompetency(employee: Employee) {
  const role = targetRoleOf(employee)
  const gap = calcSkillGap(employee, role)
  const results = gap.gaps
    .map((item) => {
      const history = employee.skillHistory[item.skillId]
      if (!history || history.length < 2) return null
      const firstBelow = history.findIndex((p) => p.level < item.required)
      if (firstBelow === -1) return null
      const crossing = history.findIndex(
        (p, i) => i > firstBelow && p.level >= item.required,
      )
      if (crossing === -1) return null
      return { skillId: item.skillId, skillName: item.skillName, months: crossing - firstBelow }
    })
    .filter((r): r is { skillId: SkillId; skillName: string; months: number } => r !== null)

  return {
    perSkill: results,
    averageMonths: results.length
      ? round1(results.reduce((sum, r) => sum + r.months, 0) / results.length)
      : null,
  }
}

/**
 * §10.11 — "Manager Satisfaction". There is no separate survey in this
 * dataset, so the manager's own performance rating and manager-review evidence
 * stand in for it, and the UI labels it as a proxy rather than a survey score.
 */
export function calcManagerSatisfaction(employee: Employee) {
  const reviews = employee.skills.flatMap((s) =>
    s.evidence.filter((e) => e.kind === 'Manager Review'),
  )
  return {
    score: round2(employee.performance / 5),
    performance: employee.performance,
    reviewCount: reviews.length,
    basis: `ใช้ผลงาน ${employee.performance.toFixed(1)}/5.0 และ Manager Review ${reviews.length} รายการ เป็นตัวแทนของ Manager Satisfaction`,
  }
}

/** Highest single skill level a person holds. */
export function peakSkillLevel(employee: Employee): number {
  return employee.skills.reduce((max, skill) => Math.max(max, skill.level), 0)
}

/** Whether anybody on a proposed team meets one specific requirement. */
export function requirementCovered(
  members: { employee: Employee }[],
  skillId: SkillId,
  level: number,
): boolean {
  return members.some((m) => skillLevelOf(m.employee, skillId) >= level)
}

export interface TeamRollup {
  skillCoverage: number
  coveredCount: number
  demandCount: number
  averageReadiness: number
  highPotentialCount: number
  averageCompletionRate: number
  internalMobilityRate: number
  mobileCount: number
  rows: {
    employee: Employee
    readiness: PromotionReadinessResult
    growth: number
    completion: ReturnType<typeof calcSkillCompletionRate>
    engagement: ReturnType<typeof calcEngagementInDevelopmentPlan>
    lowOutcomeCount: number
  }[]
}

/**
 * The team view of the Tracking screen (§11 Screen 7). Rolled up here rather
 * than in the component so §14.1 holds: a screen renders numbers, it does not
 * compute them.
 */
export function summariseTeam(
  employees: Employee[],
  progress: { completed: Record<string, string[]>; started: Record<string, string[]> },
): TeamRollup {
  const health = calcWorkforceHealth(employees)
  const rows = employees.map((employee) => ({
    employee,
    readiness: calcPromotionReadiness(employee),
    growth: avgMonthlyGrowth(employee),
    completion: calcSkillCompletionRate(employee, progress.completed[employee.id] ?? []),
    engagement: calcEngagementInDevelopmentPlan(employee, progress.started[employee.id] ?? []),
    lowOutcomeCount: learningOutcomes(employee).filter((o) => o.outcome.lowOutcomeFlag).length,
  }))

  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

  return {
    skillCoverage: health.skillCoverage,
    coveredCount: health.coveredSkills.length,
    demandCount: health.demand.length,
    averageReadiness: round2(mean(rows.map((r) => r.readiness.score))),
    highPotentialCount: health.highPotential.length,
    averageCompletionRate: round2(mean(rows.map((r) => r.completion.rate))),
    internalMobilityRate: health.internalMobilityRate,
    mobileCount: health.internalMobility.length,
    rows: rows.sort((a, b) => b.readiness.score - a.readiness.score),
  }
}

// ───────────────────────────────────────────────────────────────  insights ──

export type InsightSeverity = 'critical' | 'warn' | 'opportunity'

export interface Insight {
  id: string
  severity: InsightSeverity
  kind: 'Critical Skill Gap' | 'At-Risk Skill' | 'Workload Risk' | 'Growth Opportunity'
  title: string
  /** Exactly what this was computed from (§10.10). */
  computedFrom: string
  formula: string
  action: { label: string; to: string }
}

/**
 * §10.10 — every insight carries the numbers it came from and the rule that
 * produced it, because an insight nobody can check is not decision support.
 */
export function generateInsights(employees: Employee[] = EMPLOYEES): Insight[] {
  const health = calcWorkforceHealth(employees)
  const insights: Insight[] = []

  for (const gap of health.criticalSkillGaps) {
    insights.push({
      id: `critical-${gap.skillId}`,
      severity: 'critical',
      kind: 'Critical Skill Gap',
      title: `ไม่มีใครทำ ${gap.skillName} ได้ถึงระดับที่งานที่รับปากไว้ต้องการ`,
      computedFrom: `${gap.sources.join(' และ ')} ต้องการระดับ ${gap.requiredLevel.toFixed(1)} แต่ในองค์กร ${employees.length} คน ไม่มีใครถึงเกณฑ์นี้`,
      formula: 'Critical Skill Gap = skill ที่มีงานเปิดรับหรือโครงการต้องการ และมีคนถึงเกณฑ์ 0 คน',
      action: { label: 'ดูตำแหน่งที่เปิดรับ', to: '/recruit' },
    })
  }

  // Every at-risk skill produces an insight. The Insights screen shows the
  // five thinnest benches by default and lets the user expand to the rest —
  // trimming the list here would hide findings from the data model itself.
  for (const risk of health.atRiskSkills) {
    insights.push({
      id: `at-risk-${risk.skillId}`,
      severity: 'warn',
      kind: 'At-Risk Skill',
      title: `${risk.skillName} มีคนเดียวที่ถึงระดับ ${OWNERSHIP_BAR.toFixed(1)}`,
      computedFrom: `${risk.ownerName} อยู่ที่ ${risk.ownerLevel.toFixed(1)}${
        risk.secondBestName
          ? ` คนถัดไปคือ ${risk.secondBestName} ที่ ${risk.secondBestLevel.toFixed(1)}`
          : ' และไม่มีคนอื่นในองค์กรที่ทำ skill นี้ได้เลย'
      }`,
      formula: `At-Risk Skill = skill ที่มีคนถึงระดับ ${OWNERSHIP_BAR.toFixed(1)} เพียง 1 คน`,
      action: { label: 'สร้าง Learning Path ให้คนสำรอง', to: '/learning' },
    })
  }

  for (const employee of health.workloadRisk) {
    insights.push({
      id: `workload-${employee.id}`,
      severity: 'warn',
      kind: 'Workload Risk',
      title: `${employee.name} รับงานอยู่ ${employee.workload}% และเป็นคนที่ผลงานสูง`,
      computedFrom: `Workload ${employee.workload}% (เกิน 85%) และผลงาน ${employee.performance.toFixed(1)}/5.0 (ตั้งแต่ 4.0 ขึ้นไป)`,
      formula: 'Workload Risk = workload มากกว่า 85% และ performance ตั้งแต่ 4.0',
      action: { label: 'กระจายงานผ่าน Team Matching', to: '/team-matching' },
    })
  }

  for (const employee of employees) {
    const talent = classifyTalent(employee)
    if (talent.type !== 'Developing Talent' || talent.score === 0) continue
    const growth = avgMonthlyGrowth(employee)
    insights.push({
      id: `growth-${employee.id}`,
      severity: 'opportunity',
      kind: 'Growth Opportunity',
      title: `${employee.name} กำลังโตเร็วกว่าค่าเฉลี่ยขององค์กร`,
      computedFrom: `skillHistory 6 เดือน (Mar–Aug 2026) โตเฉลี่ย +${growth.toFixed(2)} ระดับต่อเดือน สูงกว่าเกณฑ์ ${GROWTH_TREND_PER_MONTH}`,
      formula: 'Growth Opportunity = Developing Talent ที่มีอัตราโตเฉลี่ยตั้งแต่ +0.15 ระดับต่อเดือน',
      action: { label: 'ดู Learning Path', to: '/learning' },
    })
  }

  for (const hp of health.highPotential) {
    insights.push({
      id: `promotion-${hp.employee.id}`,
      severity: 'opportunity',
      kind: 'Growth Opportunity',
      title: `${hp.employee.name} มี Promotion Readiness ${Math.round(hp.readiness.score * 100)}% สำหรับ ${hp.readiness.roleTitle}`,
      computedFrom: hp.readiness.components.map((c) => `${c.label} ${c.earned}/${c.weight}`).join(' · '),
      formula: 'Promotion Readiness = (skill ที่ผ่านเกณฑ์ × 0.7) + (performance/5 × 0.2) + (min(ปีในตำแหน่ง/3, 1) × 0.1)',
      action: { label: 'ดูโปรไฟล์', to: `/employees/${hp.employee.id}` },
    })
  }

  const order: Record<InsightSeverity, number> = { critical: 0, warn: 1, opportunity: 2 }
  return insights.sort((a, b) => order[a.severity] - order[b.severity])
}
