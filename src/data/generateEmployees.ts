import { bi } from '@/lib/i18n/types'

import { HISTORY_MONTHS } from './dates'
import { getRole } from './roles'
import type {
  Department,
  Employee,
  EmployeeProject,
  Evidence,
  EvidenceKind,
  EmployeeSkill,
  LearningRecord,
  SkillHistoryPoint,
  SkillId,
} from './types'

/**
 * Synthetic headcount to round out the 14 hand-authored employees into a
 * dataset that reads like a real 100+ person company, without the effort (or
 * false precision) of hand-authoring each one.
 *
 * Deterministic and seed-fixed — no Math.random() anywhere in this file — so
 * the "same data, same picture" guarantee the rest of the app relies on (the
 * constellation layout, the planted §9.4 cases, every test that reads
 * EMPLOYEES) holds for the generated population too. Re-running the app, or
 * this module, always produces byte-identical people.
 *
 * Three skill levels are hard-capped below the 4.0 ownership bar for every
 * synthetic employee, never an exception:
 *   - AI Tools           → §9.4's critical gap must stay critical (0 owners)
 *   - UX Research        → must stay at-risk with exactly 1 owner (Pimchanok)
 *   - Financial Analysis → must stay at-risk with exactly 1 owner (Siriporn)
 * Every other skill is free to gain a second or third qualified person as the
 * org grows — that is what should happen at 114 people, not a regression.
 *
 * Workload and performance are kept from both crossing at once (workload >85
 * and performance ≥4.0), so the only two Workload Risk cases stay Piya and
 * Wichai, per §9.4 — a synthetic overloaded person is either not a strong
 * performer, or not actually overloaded.
 */

// ─────────────────────────────────────────────────────────────── seeded rng ──

/** mulberry32 — small, fast, and the same sequence every run for a given seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function next(): number {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A fixed, arbitrary seed — "HRADA synthetic staff, batch 1" as a number. */
const SEED = 730114

class Rng {
  private next: () => number
  constructor(seed: number) {
    this.next = mulberry32(seed)
  }
  float(min = 0, max = 1): number {
    return min + this.next() * (max - min)
  }
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1))
  }
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)]
  }
  /** True with the given probability, e.g. chance(0.15) is true 15% of the time. */
  chance(probability: number): boolean {
    return this.next() < probability
  }
  /** Round to one decimal, the same precision every hand-authored level uses. */
  level(min: number, max: number): number {
    return Math.round(this.float(min, max) * 10) / 10
  }
}

// ─────────────────────────────────────────────────────────────────── names ──

/**
 * First-name / surname-initial pools, each carrying its own Latin
 * transliteration. §5's Thai-primary / Latin-secondary display convention
 * needs both forms for every generated person, not just the hand-authored 14.
 */
const FIRST_NAMES: { th: string; en: string }[] = [
  { th: 'สมชาย', en: 'Somchai' },
  { th: 'สมหญิง', en: 'Somying' },
  { th: 'วิภา', en: 'Wipha' },
  { th: 'ธนพล', en: 'Thanapon' },
  { th: 'กาญจนา', en: 'Kanjana' },
  { th: 'ประภาส', en: 'Praphat' },
  { th: 'สุนิสา', en: 'Sunisa' },
  { th: 'อรรถพล', en: 'Attapon' },
  { th: 'พิมพ์ใจ', en: 'Pimjai' },
  { th: 'ชัยวัฒน์', en: 'Chaiwat' },
  { th: 'นภัสสร', en: 'Napassorn' },
  { th: 'ธีรพงษ์', en: 'Teerapong' },
  { th: 'อัจฉรา', en: 'Ajchara' },
  { th: 'กิตติศักดิ์', en: 'Kittisak' },
  { th: 'วรรณา', en: 'Wanna' },
  { th: 'ณัฐพล', en: 'Nattapon' },
  { th: 'สิริพร', en: 'Siriporn' },
  { th: 'ปิยะพงษ์', en: 'Piyapong' },
  { th: 'จิราภรณ์', en: 'Jiraporn' },
  { th: 'วีระชัย', en: 'Weerachai' },
  { th: 'มนัสนันท์', en: 'Manatsanan' },
  { th: 'ศุภกิจ', en: 'Supakit' },
  { th: 'รัตนา', en: 'Rattana' },
  { th: 'ธนากร', en: 'Thanakorn' },
  { th: 'พรทิพย์', en: 'Porntip' },
  { th: 'อนุชิต', en: 'Anuchit' },
  { th: 'สุพัตรา', en: 'Supattra' },
  { th: 'กมลชนก', en: 'Kamonchanok' },
  { th: 'ภาณุวัฒน์', en: 'Phanuwat' },
  { th: 'เบญจวรรณ', en: 'Benjawan' },
  { th: 'ธวัชชัย', en: 'Thawatchai' },
  { th: 'นันทพร', en: 'Nantaporn' },
  { th: 'ศักดิ์สิทธิ์', en: 'Saksit' },
  { th: 'อารีรัตน์', en: 'Areerat' },
  { th: 'ปกรณ์เกียรติ', en: 'Pakornkiat' },
  { th: 'ชลธิชา', en: 'Chonticha' },
  { th: 'วิทวัส', en: 'Witthawat' },
  { th: 'สุดารัตน์', en: 'Sudarat' },
  { th: 'ณรงค์ศักดิ์', en: 'Narongsak' },
  { th: 'พัชรินทร์', en: 'Patcharin' },
  { th: 'เอกชัย', en: 'Ekachai' },
  { th: 'วราภรณ์', en: 'Waraporn' },
  { th: 'สุรเดช', en: 'Suradet' },
  { th: 'นงลักษณ์', en: 'Nongluck' },
  { th: 'ปราโมทย์', en: 'Pramote' },
  { th: 'จันทิมา', en: 'Chantima' },
  { th: 'ธนโชติ', en: 'Thanachot' },
  { th: 'สิรินทรา', en: 'Sirintra' },
  { th: 'อภิสิทธิ์', en: 'Apisit' },
  { th: 'กัญญารัตน์', en: 'Kanyarat' },
]

const SURNAME_INITIALS: { th: string; en: string }[] = [
  { th: 'ก.', en: 'K.' },
  { th: 'ข.', en: 'Kh.' },
  { th: 'จ.', en: 'J.' },
  { th: 'ช.', en: 'Ch.' },
  { th: 'ด.', en: 'D.' },
  { th: 'ต.', en: 'T.' },
  { th: 'น.', en: 'N.' },
  { th: 'บ.', en: 'B.' },
  { th: 'ป.', en: 'P.' },
  { th: 'ผ.', en: 'Ph.' },
  { th: 'พ.', en: 'Ph.' },
  { th: 'ม.', en: 'M.' },
  { th: 'ย.', en: 'Y.' },
  { th: 'ร.', en: 'R.' },
  { th: 'ล.', en: 'L.' },
  { th: 'ว.', en: 'W.' },
  { th: 'ศ.', en: 'S.' },
  { th: 'ส.', en: 'S.' },
  { th: 'ห.', en: 'H.' },
  { th: 'อ.', en: 'A.' },
]

function generateName(rng: Rng): { name: string; nameLatin: string } {
  const first = rng.pick(FIRST_NAMES)
  const last = rng.pick(SURNAME_INITIALS)
  return { name: `${first.th} ${last.th}`, nameLatin: `${first.en} ${last.en}` }
}

// ─────────────────────────────────────────────────────────── department shape ──

type Tier = 'junior' | 'mid' | 'senior'

interface DepartmentShape {
  /** Current-title pool, by seniority tier. */
  titles: Record<Tier, string[]>
  /** Skills this department leans on, heaviest first — drives who gets a real level. */
  coreSkills: SkillId[]
  /** Everyone gets a trace level in a few of these too, for texture. */
  peripheralSkills: SkillId[]
  /** Believable project names for this department's EmployeeProject entries. */
  projectNames: string[]
  careerGoalRoleIds: string[]
}

const DEPARTMENT_SHAPE: Record<Department, DepartmentShape> = {
  Marketing: {
    titles: {
      junior: ['Marketing Coordinator', 'Content Assistant', 'Social Media Executive'],
      mid: ['Marketing Executive', 'Content Specialist', 'SEO Specialist', 'Brand Executive'],
      senior: ['Senior Marketing Executive', 'Growth Marketer', 'Marketing Lead'],
    },
    coreSkills: ['digital-marketing', 'content-creation', 'seo', 'copywriting'],
    peripheralSkills: ['graphic-design', 'market-research', 'client-handling', 'presentation'],
    projectNames: [
      'Seasonal Campaign Refresh',
      'Brand Voice Guidelines',
      'Lead Generation Sprint',
      'Content Calendar Overhaul',
      'Paid Social Pilot',
    ],
    careerGoalRoleIds: ['marketing-manager', 'growth-lead', 'creative-lead', 'marketing-executive'],
  },
  Sales: {
    titles: {
      junior: ['Sales Coordinator', 'Junior Sales Executive'],
      mid: ['Sales Executive', 'Account Executive', 'Business Development Executive'],
      senior: ['Senior Sales Executive', 'Key Account Manager', 'Sales Team Lead'],
    },
    coreSkills: ['client-handling', 'presentation', 'market-research'],
    peripheralSkills: ['leadership', 'coaching', 'digital-marketing'],
    projectNames: [
      'SMB Territory Expansion',
      'Renewal Push',
      'Partner Channel Pilot',
      'Key Account Review',
      'Outbound Sprint',
    ],
    careerGoalRoleIds: ['sales-director', 'senior-sales-executive'],
  },
  Data: {
    titles: {
      junior: ['Junior Data Analyst', 'Data Coordinator'],
      mid: ['Data Analyst', 'BI Analyst', 'Data Engineer'],
      senior: ['Senior Data Analyst', 'Data Scientist', 'Analytics Lead'],
    },
    coreSkills: ['data-analysis', 'sql'],
    peripheralSkills: ['ai-tools', 'software-development', 'presentation', 'leadership'],
    projectNames: [
      'Warehouse Cleanup',
      'Churn Model Refresh',
      'Reporting Automation',
      'Dashboard Consolidation',
      'Forecast Pilot',
    ],
    careerGoalRoleIds: ['head-of-data', 'data-analyst'],
  },
  Product: {
    titles: {
      junior: ['Junior Software Developer', 'QA Analyst', 'UX Research Assistant'],
      mid: ['Software Developer', 'UX Researcher', 'Product Analyst', 'QA Engineer'],
      senior: ['Senior Software Developer', 'Product Manager', 'Lead Developer', 'UX Designer'],
    },
    coreSkills: ['software-development', 'product-management'],
    peripheralSkills: ['ai-tools', 'sql', 'data-analysis', 'presentation', 'leadership', 'client-handling'],
    projectNames: [
      'Onboarding Redesign',
      'API Consolidation',
      'Usability Study Round',
      'Performance Cleanup',
      'Internal Tooling Refresh',
    ],
    careerGoalRoleIds: ['head-of-product', 'lead-researcher', 'tech-lead'],
  },
  Operations: {
    titles: {
      junior: ['Ops Assistant', 'HR Coordinator', 'Finance Assistant'],
      mid: ['Ops Coordinator', 'HR Executive', 'Financial Analyst', 'Admin Executive'],
      senior: ['Senior Ops Coordinator', 'HR Manager', 'Finance Manager', 'Ops Supervisor'],
    },
    coreSkills: ['project-management', 'coaching', 'leadership'],
    peripheralSkills: ['client-handling', 'presentation', 'data-analysis'],
    projectNames: [
      'Vendor Consolidation',
      'Policy Refresh',
      'Budget Cycle Cleanup',
      'Onboarding Process Review',
      'Compliance Audit Prep',
    ],
    careerGoalRoleIds: ['hr-director', 'ops-manager', 'finance-manager'],
  },
}

/**
 * The two ownership-critical skills belong to specific departments in the
 * hand-authored data (UX Research to Product, Financial Analysis to
 * Operations); they still show up as small, capped, peripheral touches
 * elsewhere, which is realistic — plenty of non-specialists dabble.
 */
const CAPPED_SKILLS: SkillId[] = ['ai-tools', 'ux-research', 'financial-analysis']
const CAP_CEILING = 3.8

// ───────────────────────────────────────────────────────────────── evidence ──

const EVIDENCE_KIND_CYCLE: EvidenceKind[] = [
  'Project',
  'Manager Review',
  'Peer Feedback',
  'Assessment',
  'Certification',
]

function generateEvidence(rng: Rng, skillLabel: string, count: number): Evidence[] {
  const evidence: Evidence[] = []
  const kinds = [...EVIDENCE_KIND_CYCLE]
  for (let i = 0; i < count; i++) {
    const kind = kinds.splice(rng.int(0, kinds.length - 1), 1)[0] ?? 'Peer Feedback'
    const year = rng.chance(0.7) ? 2025 : 2026
    evidence.push({
      kind,
      year,
      detail: evidenceDetail(kind, skillLabel),
    })
  }
  return evidence
}

function evidenceDetail(kind: EvidenceKind, skillLabel: string) {
  switch (kind) {
    case 'Project':
      return bi(`ทำโครงการที่ใช้ ${skillLabel} จนสำเร็จ`, `Delivered a project that relied on ${skillLabel}`)
    case 'Manager Review':
      return bi(`หัวหน้าประเมินว่าทำ ${skillLabel} ได้ดีสม่ำเสมอ`, `Manager rates ${skillLabel} as consistently solid`)
    case 'Peer Feedback':
      return bi(`เพื่อนร่วมทีมขอคำแนะนำเรื่อง ${skillLabel} อยู่บ่อยครั้ง`, `Teammates regularly ask for input on ${skillLabel}`)
    case 'Assessment':
      return bi(`ผ่านแบบประเมิน ${skillLabel} ในระดับดี`, `Scored well on an internal ${skillLabel} assessment`)
    case 'Certification':
      return bi(`ได้ใบรับรองที่เกี่ยวข้องกับ ${skillLabel}`, `Holds a certification related to ${skillLabel}`)
  }
}

// ──────────────────────────────────────────────────────────── one employee ──

function buildSkillHistory(rng: Rng, level: number): SkillHistoryPoint[] {
  // A gentle, mostly-rising trend that lands exactly on the current level —
  // the same shape every hand-authored series uses.
  const monthsBack = HISTORY_MONTHS.length
  const startDrop = rng.float(0.15, 0.6)
  const start = Math.max(0.5, level - startDrop)
  const points: number[] = []
  for (let i = 0; i < monthsBack; i++) {
    const t = i / (monthsBack - 1)
    const eased = start + (level - start) * t
    const wobble = i === monthsBack - 1 ? 0 : rng.float(-0.05, 0.05)
    points.push(Math.round(Math.max(0, Math.min(5, eased + wobble)) * 10) / 10)
  }
  points[points.length - 1] = level
  return HISTORY_MONTHS.map((month, i) => ({ month, level: points[i] }))
}

function generateEmployee(index: number, department: Department, rng: Rng): Employee {
  const id = `emp-${String(index).padStart(2, '0')}`
  const shape = DEPARTMENT_SHAPE[department]
  const { name, nameLatin } = generateName(rng)

  // Seniority pyramid: mostly junior/mid, a real but minority senior slice —
  // matching how an actual 100+ person company's levels distribute.
  const tierRoll = rng.float()
  const tier: Tier = tierRoll < 0.45 ? 'junior' : tierRoll < 0.85 ? 'mid' : 'senior'

  const tierRanges: Record<Tier, { core: [number, number]; peripheral: [number, number]; years: [number, number]; perf: [number, number] }> = {
    junior: { core: [1.6, 3.1], peripheral: [1.0, 2.3], years: [0.5, 2.5], perf: [3.0, 4.0] },
    mid: { core: [2.6, 3.9], peripheral: [1.3, 2.8], years: [2, 6], perf: [3.3, 4.4] },
    senior: { core: [3.4, 4.7], peripheral: [1.8, 3.4], years: [5, 13], perf: [3.7, 4.9] },
  }
  const range = tierRanges[tier]

  const skills: EmployeeSkill[] = []
  const levelById = new Map<SkillId, number>()

  for (const skillId of shape.coreSkills) {
    let level = rng.level(...range.core)
    if (CAPPED_SKILLS.includes(skillId)) level = Math.min(level, CAP_CEILING)
    levelById.set(skillId, level)
  }
  for (const skillId of shape.peripheralSkills) {
    // Not every peripheral skill applies to every person — roughly two thirds do.
    if (!rng.chance(0.68)) continue
    let level = rng.level(...range.peripheral)
    if (CAPPED_SKILLS.includes(skillId)) level = Math.min(level, CAP_CEILING)
    levelById.set(skillId, level)
  }
  // A small, capped-below-4.0 trace of AI Tools even outside Data/Product —
  // realistic in a digital-services company, and safely under the bar.
  if (!levelById.has('ai-tools') && rng.chance(0.4)) {
    levelById.set('ai-tools', Math.min(rng.level(1.0, 2.6), CAP_CEILING))
  }

  for (const [skillId, level] of levelById) {
    const evidenceCount = level >= 3.0 ? rng.int(2, 3) : rng.chance(0.4) ? 1 : 0
    skills.push(sk(skillId, level, generateEvidence(rng, humanSkillLabel(skillId), evidenceCount)))
  }
  skills.sort((a, b) => b.level - a.level)

  const performance = round1(rng.float(...range.perf))
  let workload = rng.int(40, 95)
  // §9.4's Workload Risk stays exactly Piya and Wichai: never let a synthetic
  // person combine "overloaded" with "high performer."
  if (workload > 85 && performance >= 4.0) workload = rng.int(60, 85)

  const yearsInRole = round1(rng.float(...range.years))
  const yearsExperience = round1(yearsInRole + rng.float(0, 4))

  const title = rng.pick(shape.titles[tier])
  const careerGoalRoleId = rng.pick(shape.careerGoalRoleIds)

  const topSkills = [...skills].sort((a, b) => b.level - a.level).slice(0, 3)
  const skillHistory: Employee['skillHistory'] = {}
  for (const skill of topSkills) {
    skillHistory[skill.skillId] = buildSkillHistory(rng, skill.level)
  }

  const projectCount = rng.int(1, 3)
  const projects: EmployeeProject[] = []
  const usedProjectNames = new Set<string>()
  for (let i = 0; i < projectCount; i++) {
    let name = rng.pick(shape.projectNames)
    if (usedProjectNames.has(name) && usedProjectNames.size < shape.projectNames.length) {
      name = shape.projectNames.find((n) => !usedProjectNames.has(n)) ?? name
    }
    usedProjectNames.add(name)
    const relevantSkills = skills.filter((s) => s.level >= 2.5)
    const skillsUsed = relevantSkills.length
      ? [rng.pick(relevantSkills).skillId, ...(rng.chance(0.5) && relevantSkills.length > 1 ? [rng.pick(relevantSkills).skillId] : [])]
      : [shape.coreSkills[0]]
    projects.push({
      name,
      role: tier === 'senior' ? 'Lead' : rng.chance(0.5) ? 'Contributor' : 'Owner',
      year: rng.chance(0.6) ? 2025 : 2026,
      skillsUsed: [...new Set(skillsUsed)],
      crossDepartment: rng.chance(0.25),
    })
  }

  const learningHistory: LearningRecord[] = []
  if (rng.chance(0.55) && topSkills[0]) {
    const target = topSkills[0]
    const before = round1(Math.max(0.5, target.level - rng.float(0.3, 0.9)))
    learningHistory.push({
      title: `${humanSkillLabel(target.skillId)} Workshop`,
      type: rng.pick(['Course', 'Workshop', 'On-the-job', 'Mentorship'] as const),
      targetSkill: target.skillId,
      completedOn: `2026-${String(rng.int(2, 7)).padStart(2, '0')}-${String(rng.int(1, 27)).padStart(2, '0')}`,
      levelBefore: before,
      levelAfter: round1(Math.min(target.level, before + rng.float(0.2, 0.6))),
    })
  }

  return {
    id,
    name,
    nameLatin,
    title,
    department,
    employmentType: 'Full-time',
    performance,
    workload,
    careerGoalRoleId,
    yearsInRole,
    yearsExperience,
    avatarHue: Math.round(rng.float(0, 360)),
    skills,
    projects,
    learningHistory,
    skillHistory,
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

const SKILL_LABELS: Partial<Record<SkillId, string>> = {
  'digital-marketing': 'Digital Marketing',
  seo: 'SEO',
  'data-analysis': 'Data Analysis',
  sql: 'SQL',
  'ai-tools': 'AI Tools',
  'software-development': 'Software Development',
  'financial-analysis': 'Financial Analysis',
  'market-research': 'Market Research',
  'ux-research': 'UX Research',
  'content-creation': 'Content Creation',
  'graphic-design': 'Graphic Design',
  copywriting: 'Copywriting',
  leadership: 'Leadership',
  coaching: 'Coaching',
  'project-management': 'Project Management',
  'product-management': 'Product Management',
  'client-handling': 'Client Handling',
  presentation: 'Presentation',
}

function humanSkillLabel(id: SkillId): string {
  return SKILL_LABELS[id] ?? id
}

function sk(skillId: SkillId, level: number, evidence: Evidence[]): EmployeeSkill {
  return { skillId, level, evidence }
}

// ─────────────────────────────────────────────────────────────── population ──

/**
 * Total headcount per department, existing 14 included — approved
 * distribution: Marketing 22, Sales 26, Data 18, Product 30, Operations 18.
 */
const DEPARTMENT_TOTALS: Record<Department, number> = {
  Marketing: 22,
  Sales: 26,
  Data: 18,
  Product: 30,
  Operations: 18,
}

const EXISTING_COUNT: Record<Department, number> = {
  Marketing: 4,
  Sales: 2,
  Data: 2,
  Product: 3,
  Operations: 3,
}

/**
 * Generates the synthetic staff — everyone beyond the 14 hand-authored
 * people. Called once, at module load, with a fixed seed; the result is the
 * same on every run.
 */
export function generateSyntheticEmployees(startId: number): Employee[] {
  const rng = new Rng(SEED)
  const employees: Employee[] = []
  let nextId = startId

  // Roles reference their careerGoalRoleId — verified against data/roles.ts,
  // never invented here, so "points every career goal at a defined role"
  // holds for generated people the same way it does for the hand-authored 14.
  for (const roleIds of Object.values(DEPARTMENT_SHAPE)) {
    for (const id of roleIds.careerGoalRoleIds) getRole(id)
  }

  for (const department of Object.keys(DEPARTMENT_TOTALS) as Department[]) {
    const toGenerate = DEPARTMENT_TOTALS[department] - EXISTING_COUNT[department]
    for (let i = 0; i < toGenerate; i++) {
      employees.push(generateEmployee(nextId, department, rng))
      nextId++
    }
  }

  return employees
}
