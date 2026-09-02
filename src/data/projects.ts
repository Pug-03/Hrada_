import type { ProjectSpec } from './types'

/** §9.7 — the three projects a Manager can staff. */
export const PROJECTS: ProjectSpec[] = [
  {
    id: 'proj-ai-marketing',
    name: 'AI Marketing Campaign',
    description:
      'แคมเปญการตลาดที่ใช้เครื่องมือ AI ช่วยผลิตและปรับเนื้อหาแบบรายสัปดาห์ วัดผลด้วยข้อมูลจริง',
    requiredSkills: [
      { skillId: 'digital-marketing', level: 4.0 },
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'content-creation', level: 3.5 },
      { skillId: 'ai-tools', level: 4.0 },
    ],
    teamSize: 4,
    durationMonths: 4,
  },
  {
    id: 'proj-customer-retention',
    name: 'Customer Retention Program',
    description: 'โครงการลดการยกเลิกบริการของลูกค้าเดิม โดยใช้ข้อมูลการใช้งานหาสัญญาณเสี่ยงล่วงหน้า',
    requiredSkills: [
      { skillId: 'data-analysis', level: 3.5 },
      { skillId: 'client-handling', level: 4.0 },
      { skillId: 'project-management', level: 3.0 },
    ],
    teamSize: 3,
    durationMonths: 6,
  },
  {
    id: 'proj-product-analytics',
    name: 'Product Analytics Revamp',
    description: 'รื้อระบบเก็บและวิเคราะห์ข้อมูลการใช้งานสินค้าใหม่ทั้งหมด ให้ทีม Product ใช้ตัดสินใจได้เร็วขึ้น',
    requiredSkills: [
      { skillId: 'sql', level: 4.0 },
      { skillId: 'ux-research', level: 3.5 },
      { skillId: 'software-development', level: 3.5 },
    ],
    teamSize: 3,
    durationMonths: 3,
  },
]

const byId = new Map(PROJECTS.map((p) => [p.id, p]))

export function getProject(id: string): ProjectSpec {
  const project = byId.get(id)
  if (!project) throw new Error(`Unknown project: ${id}`)
  return project
}
