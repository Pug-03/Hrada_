import type { Skill, SkillCategory, SkillId } from './types'

/** §9.2 — the organisation's 18 tracked skills. */
export const SKILLS: Skill[] = [
  { id: 'digital-marketing', name: 'Digital Marketing', category: 'Technical' },
  { id: 'seo', name: 'SEO', category: 'Technical' },
  { id: 'data-analysis', name: 'Data Analysis', category: 'Technical' },
  { id: 'sql', name: 'SQL', category: 'Technical' },
  { id: 'ai-tools', name: 'AI Tools', category: 'Technical' },
  { id: 'software-development', name: 'Software Development', category: 'Technical' },
  { id: 'financial-analysis', name: 'Financial Analysis', category: 'Analytical' },
  { id: 'market-research', name: 'Market Research', category: 'Analytical' },
  { id: 'ux-research', name: 'UX Research', category: 'Analytical' },
  { id: 'content-creation', name: 'Content Creation', category: 'Creative' },
  { id: 'graphic-design', name: 'Graphic Design', category: 'Creative' },
  { id: 'copywriting', name: 'Copywriting', category: 'Creative' },
  { id: 'leadership', name: 'Leadership', category: 'Leadership' },
  { id: 'coaching', name: 'Coaching', category: 'Leadership' },
  { id: 'project-management', name: 'Project Management', category: 'Leadership' },
  { id: 'product-management', name: 'Product Management', category: 'Leadership' },
  { id: 'client-handling', name: 'Client Handling', category: 'Communication' },
  { id: 'presentation', name: 'Presentation', category: 'Communication' },
]

const byId = new Map(SKILLS.map((s) => [s.id, s]))

export function getSkill(id: SkillId): Skill {
  const skill = byId.get(id)
  if (!skill) throw new Error(`Unknown skill: ${id}`)
  return skill
}

export function skillName(id: SkillId): string {
  return getSkill(id).name
}

export function skillCategory(id: SkillId): SkillCategory {
  return getSkill(id).category
}

/**
 * §7 — the level scale. Bands are inclusive of `min`, and of `max` at the top
 * of each band, so 3.0 is Practicing and 3.1 is Proficient.
 */
/**
 * The meaning of each band lives in the dictionaries as `band.<name>`, not
 * here — it is copy shown to the user, and this module is data.
 */
export interface SkillBand {
  min: number
  max: number
  name: 'None' | 'Aware' | 'Practicing' | 'Proficient' | 'Advanced' | 'Expert'
}

export const SKILL_BANDS: SkillBand[] = [
  { min: 0, max: 1.0, name: 'None' },
  { min: 1.1, max: 2.0, name: 'Aware' },
  { min: 2.1, max: 3.0, name: 'Practicing' },
  { min: 3.1, max: 4.0, name: 'Proficient' },
  { min: 4.1, max: 4.7, name: 'Advanced' },
  { min: 4.8, max: 5.0, name: 'Expert' },
]

export function bandFor(level: number): SkillBand {
  const band = SKILL_BANDS.find((b) => level <= b.max)
  return band ?? SKILL_BANDS[SKILL_BANDS.length - 1]
}
