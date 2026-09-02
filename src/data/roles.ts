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
    rationale: 'คุมทีมและงบการตลาดทั้งหมด ต้องนำทีมได้จริง ไม่ใช่แค่ทำงานเก่ง',
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
    rationale: 'วางกลยุทธ์ข้อมูลระดับองค์กร และต้องสร้างคนในทีมต่อได้',
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
    rationale: 'เป็นเจ้าของตัวเลขการเติบโต ต้องอ่านข้อมูลเองและนำทีมเล็กได้',
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
    rationale: 'ดูแลมาตรฐานงานสร้างสรรค์ทั้งหมด และคุมคิวงานหลายชิ้นพร้อมกัน',
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
    rationale: 'ทำงานวิเคราะห์ได้เองเต็มตัว และนำเสนอผลให้ทีมธุรกิจเข้าใจได้',
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
    rationale: 'วางแผนกำลังคนระดับองค์กร ต้องคุยเรื่องงบและตัวเลขกับผู้บริหารได้',
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
    rationale: 'รับผิดชอบเป้าทั้งสายงาน ต้องสร้างทีมขายรุ่นถัดไปได้ด้วย',
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
    rationale: 'ดูแลลูกค้ารายใหญ่ได้เอง ตั้งแต่หาโอกาสจนปิดดีล',
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
    rationale: 'ตัดสินใจทิศทางสินค้า ต้องคุยกับลูกค้าและทีมขายได้โดยตรง',
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
    rationale: 'ตั้งโจทย์วิจัยเองได้ และเปลี่ยนผลวิจัยเป็นการตัดสินใจของสินค้า',
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
    rationale: 'ออกแบบระบบและรีวิวงานคนอื่น ไม่ใช่แค่เขียนโค้ดของตัวเอง',
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
    rationale: 'คุมงานปฏิบัติการหลายสายพร้อมกัน และคุมต้นทุนได้',
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
    rationale: 'ปิดงบและวางแผนการเงินได้เอง พร้อมอธิบายให้ทีมที่ไม่ใช่สายการเงินเข้าใจ',
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
    rationale: 'รับผิดชอบแคมเปญของตัวเองได้ตั้งแต่ต้นจนจบ',
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
