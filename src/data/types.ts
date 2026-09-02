/**
 * HRADA domain model.
 *
 * Everything the UI renders is derived from these structures by pure functions
 * in src/lib/scoring.ts. No screen may hold a number of its own.
 */

import type { LocalizedText } from '@/lib/i18n/types'

export type Department = 'Marketing' | 'Sales' | 'Data' | 'Product' | 'Operations'

export type SkillCategory =
  | 'Technical'
  | 'Analytical'
  | 'Creative'
  | 'Leadership'
  | 'Communication'

export type SkillId =
  | 'digital-marketing'
  | 'seo'
  | 'data-analysis'
  | 'sql'
  | 'ai-tools'
  | 'software-development'
  | 'financial-analysis'
  | 'market-research'
  | 'ux-research'
  | 'content-creation'
  | 'graphic-design'
  | 'copywriting'
  | 'leadership'
  | 'coaching'
  | 'project-management'
  | 'product-management'
  | 'client-handling'
  | 'presentation'

export interface Skill {
  id: SkillId
  /** English name — HR terminology stays English per §6. */
  name: string
  category: SkillCategory
}

/** §9.3 — evidence kinds a skill level may be justified by. */
export type EvidenceKind =
  | 'Project'
  | 'Certification'
  | 'Manager Review'
  | 'Assessment'
  | 'Peer Feedback'

export interface Evidence {
  kind: EvidenceKind
  /** Rendered after the kind, e.g. "Project: Q1 Rebrand". */
  detail: LocalizedText
  year: number
}

export interface EmployeeSkill {
  skillId: SkillId
  /** 0.0–5.0, see §7 for the named bands. */
  level: number
  evidence: Evidence[]
}

export type EmploymentType = 'Full-time' | 'Contract' | 'Intern' | 'Freelancer'

export interface EmployeeProject {
  name: string
  role: string
  year: number
  skillsUsed: SkillId[]
  /** True when the project pulled in people from another department. */
  crossDepartment: boolean
}

export type LearningType =
  | 'Course'
  | 'Workshop'
  | 'Project'
  | 'Mentorship'
  | 'On-the-job'
  | 'Certification'

export interface LearningRecord {
  title: string
  type: LearningType
  targetSkill: SkillId
  completedOn: string
  levelBefore: number
  levelAfter: number
}

/** One monthly observation of one skill. Months are ISO 'YYYY-MM'. */
export interface SkillHistoryPoint {
  month: string
  level: number
}

export interface Employee {
  id: string
  /** Display name, Thai script. */
  name: string
  /** Latin transliteration as written in the spec's §9.3 table. */
  nameLatin: string
  title: string
  department: Department
  employmentType: EmploymentType
  /** 0–5 manager performance rating. */
  performance: number
  /** Percent of capacity currently committed, 0–100. */
  workload: number
  /** Id of a RoleDefinition in data/roles.ts. */
  careerGoalRoleId: string
  yearsInRole: number
  yearsExperience: number
  avatarHue: number
  skills: EmployeeSkill[]
  projects: EmployeeProject[]
  learningHistory: LearningRecord[]
  /** Six monthly points (2026-03 … 2026-08) for the person's top three skills. */
  skillHistory: Partial<Record<SkillId, SkillHistoryPoint[]>>
}

export interface SkillRequirement {
  skillId: SkillId
  level: number
}

/** A target role someone can grow into. Drives skill gap + promotion readiness. */
export interface RoleDefinition {
  id: string
  title: string
  department: Department
  requiredSkills: SkillRequirement[]
  /** Why the role needs what it needs — shown in the explanation panel. */
  rationale: LocalizedText
}

export interface Job {
  id: string
  title: string
  department: Department
  description: LocalizedText
  responsibilities: LocalizedText[]
  requiredSkills: SkillRequirement[]
  preferredSkills: SkillRequirement[]
  minExperience: number
  education: LocalizedText
  employmentType: EmploymentType
  location: LocalizedText
  salaryRange: { min: number; max: number; currency: 'THB' }
}

export interface CandidateSkill {
  skillId: SkillId
  level: number
}

export interface CandidateProject {
  name: string
  skillsUsed: SkillId[]
}

export interface Candidate {
  id: string
  name: string
  nameLatin: string
  education: LocalizedText
  yearsExperience: number
  skills: CandidateSkill[]
  certifications: string[]
  projects: CandidateProject[]
  portfolio?: string
  /** 0–100 structured assessment result. */
  assessmentScore: number
  appliedJobId: string
  avatarHue: number
}

export interface ProjectSpec {
  id: string
  name: string
  description: LocalizedText
  requiredSkills: SkillRequirement[]
  teamSize: number
  durationMonths: number
}

export interface LearningItem {
  id: string
  title: string
  type: LearningType
  targetSkill: SkillId
  /** 1 = introductory, 3 = advanced. */
  difficulty: 1 | 2 | 3
  durationHours: number
}

export type TalentType = 'Core Expert' | 'Bridge Member' | 'Developing Talent'

export type UserRole = 'HR' | 'Manager' | 'Employee' | 'CEO'
