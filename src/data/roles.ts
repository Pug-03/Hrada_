import { bi } from '@/lib/i18n/types'

import type { RoleDefinition } from './types'

/**
 * Target roles people are growing toward (§9.3 "Career Goal").
 *
 * The spec fixes exactly one requirement — Jenjira's Marketing Manager needs
 * Leadership 4.0 (§9.4 case 5) — and leaves the other thirteen roles open.
 * These sets were written to sit one clear step above the person aiming at
 * them, and they are what calcSkillGap and calcPromotionReadiness read.
 *
 * They deliberately do NOT feed the organisation-wide coverage analysis: a
 * role somebody aspires to is not work the business owes a client this
 * quarter. Only open jobs and active projects count as demand there.
 */
export const ROLES: RoleDefinition[] = [
  {
    id: 'marketing-manager',
    title: 'Marketing Manager',
    department: 'Marketing',
    rationale: bi(
      'คุมทีมและงบการตลาดทั้งหมด ต้องนำทีมได้จริง ไม่ใช่แค่ทำงานเก่ง',
      'Owns the team and the whole marketing budget — has to actually lead, not just do the work well',
    ),
    requiredSkills: [
      { skillId: 'digital-marketing', level: 4.0 },
      { skillId: 'content-creation', level: 3.5 },
      { skillId: 'client-handling', level: 3.5 },
      { skillId: 'data-analysis', level: 3.0 },
      { skillId: 'leadership', level: 4.0 },
    ],
  },
  {
    id: 'head-of-data',
    title: 'Head of Data',
    department: 'Data',
    rationale: bi(
      'วางกลยุทธ์ข้อมูลระดับองค์กร และต้องสร้างคนในทีมต่อได้',
      'Sets data strategy for the organisation, and has to build the people on the team',
    ),
    requiredSkills: [
      { skillId: 'data-analysis', level: 4.5 },
      { skillId: 'sql', level: 4.5 },
      { skillId: 'ai-tools', level: 4.0 },
      { skillId: 'leadership', level: 4.0 },
      { skillId: 'coaching', level: 3.5 },
      { skillId: 'project-management', level: 3.5 },
    ],
  },
  {
    id: 'growth-lead',
    title: 'Growth Lead',
    department: 'Marketing',
    rationale: bi(
      'เป็นเจ้าของตัวเลขการเติบโต ต้องอ่านข้อมูลเองและนำทีมเล็กได้',
      'Owns the growth numbers, reads the data unaided, and leads a small team',
    ),
    requiredSkills: [
      { skillId: 'seo', level: 3.5 },
      { skillId: 'digital-marketing', level: 3.5 },
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'content-creation', level: 3.0 },
      { skillId: 'leadership', level: 3.0 },
    ],
  },
  {
    id: 'creative-lead',
    title: 'Creative Lead',
    department: 'Marketing',
    rationale: bi(
      'ดูแลมาตรฐานงานสร้างสรรค์ทั้งหมด และคุมคิวงานหลายชิ้นพร้อมกัน',
      'Holds the standard for all creative work and keeps several jobs moving at once',
    ),
    requiredSkills: [
      { skillId: 'content-creation', level: 4.5 },
      { skillId: 'copywriting', level: 4.0 },
      { skillId: 'graphic-design', level: 4.0 },
      { skillId: 'leadership', level: 3.5 },
      { skillId: 'project-management', level: 3.0 },
    ],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    department: 'Data',
    rationale: bi(
      'ทำงานวิเคราะห์ได้เองเต็มตัว และนำเสนอผลให้ทีมธุรกิจเข้าใจได้',
      'Runs analysis independently and presents the result so the business side follows it',
    ),
    requiredSkills: [
      { skillId: 'sql', level: 3.5 },
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'ai-tools', level: 3.0 },
      { skillId: 'presentation', level: 2.5 },
    ],
  },
  {
    id: 'hr-director',
    title: 'HR Director',
    department: 'Operations',
    rationale: bi(
      'วางแผนกำลังคนระดับองค์กร ต้องคุยเรื่องงบและตัวเลขกับผู้บริหารได้',
      'Plans headcount organisation-wide, and talks budget and numbers with the executive team',
    ),
    requiredSkills: [
      { skillId: 'coaching', level: 4.0 },
      { skillId: 'leadership', level: 4.0 },
      { skillId: 'presentation', level: 4.0 },
      { skillId: 'project-management', level: 3.5 },
      { skillId: 'financial-analysis', level: 3.0 },
    ],
  },
  {
    id: 'sales-director',
    title: 'Sales Director',
    department: 'Sales',
    rationale: bi(
      'รับผิดชอบเป้าทั้งสายงาน ต้องสร้างทีมขายรุ่นถัดไปได้ด้วย',
      'Carries the target for the whole function, and builds the next generation of the sales team',
    ),
    requiredSkills: [
      { skillId: 'client-handling', level: 4.5 },
      { skillId: 'presentation', level: 4.0 },
      { skillId: 'leadership', level: 4.5 },
      { skillId: 'market-research', level: 3.5 },
      { skillId: 'coaching', level: 3.5 },
    ],
  },
  {
    id: 'senior-sales-executive',
    title: 'Senior Sales Executive',
    department: 'Sales',
    rationale: bi(
      'ดูแลลูกค้ารายใหญ่ได้เอง ตั้งแต่หาโอกาสจนปิดดีล',
      'Handles major accounts alone, from finding the opportunity to closing it',
    ),
    requiredSkills: [
      { skillId: 'client-handling', level: 4.0 },
      { skillId: 'presentation', level: 3.5 },
      { skillId: 'market-research', level: 3.0 },
      { skillId: 'content-creation', level: 2.5 },
    ],
  },
  {
    id: 'head-of-product',
    title: 'Head of Product',
    department: 'Product',
    rationale: bi(
      'ตัดสินใจทิศทางสินค้า ต้องคุยกับลูกค้าและทีมขายได้โดยตรง',
      'Decides product direction, and talks to customers and the sales team directly',
    ),
    requiredSkills: [
      { skillId: 'product-management', level: 4.0 },
      { skillId: 'ux-research', level: 3.5 },
      { skillId: 'leadership', level: 3.5 },
      { skillId: 'data-analysis', level: 3.0 },
      { skillId: 'presentation', level: 3.0 },
      { skillId: 'client-handling', level: 3.5 },
    ],
  },
  {
    id: 'lead-researcher',
    title: 'Lead Researcher',
    department: 'Product',
    rationale: bi(
      'ตั้งโจทย์วิจัยเองได้ และเปลี่ยนผลวิจัยเป็นการตัดสินใจของสินค้า',
      'Frames the research question and turns the findings into product decisions',
    ),
    requiredSkills: [
      { skillId: 'ux-research', level: 4.0 },
      { skillId: 'presentation', level: 4.0 },
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'leadership', level: 3.0 },
      { skillId: 'product-management', level: 3.0 },
    ],
  },
  {
    id: 'tech-lead',
    title: 'Tech Lead',
    department: 'Product',
    rationale: bi(
      'ออกแบบระบบและรีวิวงานคนอื่น ไม่ใช่แค่เขียนโค้ดของตัวเอง',
      'Designs the system and reviews other people’s work, not only their own code',
    ),
    requiredSkills: [
      { skillId: 'software-development', level: 4.5 },
      { skillId: 'ai-tools', level: 4.0 },
      { skillId: 'sql', level: 4.0 },
      { skillId: 'leadership', level: 3.5 },
      { skillId: 'project-management', level: 3.0 },
    ],
  },
  {
    id: 'ops-manager',
    title: 'Ops Manager',
    department: 'Operations',
    rationale: bi(
      'คุมงานปฏิบัติการหลายสายพร้อมกัน และคุมต้นทุนได้',
      'Runs several operational lines at once, and controls the cost of them',
    ),
    requiredSkills: [
      { skillId: 'project-management', level: 4.0 },
      { skillId: 'client-handling', level: 3.5 },
      { skillId: 'leadership', level: 3.5 },
      { skillId: 'presentation', level: 3.0 },
      { skillId: 'financial-analysis', level: 2.5 },
    ],
  },
  {
    id: 'finance-manager',
    title: 'Finance Manager',
    department: 'Operations',
    rationale: bi(
      'ปิดงบและวางแผนการเงินได้เอง พร้อมอธิบายให้ทีมที่ไม่ใช่สายการเงินเข้าใจ',
      'Closes the books and plans independently, and explains it to people outside finance',
    ),
    requiredSkills: [
      { skillId: 'financial-analysis', level: 4.0 },
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'sql', level: 3.0 },
      { skillId: 'leadership', level: 3.5 },
      { skillId: 'presentation', level: 3.0 },
    ],
  },
  {
    id: 'marketing-executive',
    title: 'Marketing Executive',
    department: 'Marketing',
    rationale: bi(
      'รับผิดชอบแคมเปญของตัวเองได้ตั้งแต่ต้นจนจบ',
      'Owns a campaign of their own from beginning to end',
    ),
    requiredSkills: [
      { skillId: 'digital-marketing', level: 3.0 },
      { skillId: 'content-creation', level: 3.0 },
      { skillId: 'seo', level: 2.5 },
      { skillId: 'ai-tools', level: 2.5 },
      { skillId: 'copywriting', level: 2.5 },
    ],
  },
]

const rolesById = new Map(ROLES.map((r) => [r.id, r]))

export function getRole(id: string): RoleDefinition {
  const role = rolesById.get(id)
  if (!role) throw new Error(`Unknown role: ${id}`)
  return role
}
