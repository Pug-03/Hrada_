import { bi } from '@/lib/i18n/types'

import type { Job } from './types'

/** §9.5 — the three open positions. */
export const JOBS: Job[] = [
  {
    id: 'job-senior-data-analyst',
    title: 'Senior Data Analyst',
    department: 'Data',
    description:
      bi(
      'รับผิดชอบงานวิเคราะห์ข้อมูลเชิงลึกให้ทีมธุรกิจ และวางมาตรฐานการทำงานกับข้อมูลร่วมกับ Data Lead',
      'Owns deep-dive analysis for the business teams, and sets the standard for working with data alongside the Data Lead',
    ),
    responsibilities: [
      bi(
      'ออกแบบและดูแลชุดข้อมูลหลักที่ทีมธุรกิจใช้ตัดสินใจ',
      'Design and maintain the core datasets the business decides on',
    ),
      bi(
      'ทำงานวิเคราะห์เชิงลึกและสรุปเป็นข้อเสนอที่นำไปใช้ได้จริง',
      'Run deep analysis and turn it into recommendations that can actually be acted on',
    ),
      bi(
      'ใช้เครื่องมือ AI ช่วยลดเวลาทำงานวิเคราะห์ประจำ',
      'Use AI tooling to cut the time routine analysis takes',
    ),
      bi(
      'ช่วยรีวิวงานของ Junior Data Analyst',
      'Review the work of the Junior Data Analyst',
    ),
    ],
    requiredSkills: [
      { skillId: 'data-analysis', level: 4.0 },
      { skillId: 'sql', level: 4.0 },
      { skillId: 'ai-tools', level: 3.5 },
    ],
    preferredSkills: [{ skillId: 'presentation', level: 3.0 }],
    minExperience: 4,
    education: bi(
      'ปริญญาตรีสาขาสถิติ วิทยาการคอมพิวเตอร์ เศรษฐศาสตร์ หรือสาขาที่เกี่ยวข้อง',
      'Bachelor’s in statistics, computer science, economics or a related field',
    ),
    employmentType: 'Full-time',
    location: bi(
      'กรุงเทพฯ (Hybrid 3 วัน/สัปดาห์)',
      'Bangkok (hybrid, 3 days a week)',
    ),
    salaryRange: { min: 65000, max: 95000, currency: 'THB' },
  },
  {
    id: 'job-content-marketing-lead',
    title: 'Content Marketing Lead',
    department: 'Marketing',
    description:
      bi(
      'ดูแลทิศทางเนื้อหาทั้งหมดของแบรนด์ ตั้งแต่แผนรายไตรมาสจนถึงมาตรฐานงานที่เผยแพร่จริง',
      'Owns the brand’s content direction, from the quarterly plan to the standard of what actually ships',
    ),
    responsibilities: [
      bi(
      'วางแผนเนื้อหารายไตรมาสให้สอดคล้องกับเป้าการเติบโต',
      'Plan quarterly content against the growth targets',
    ),
      bi(
      'ดูแลมาตรฐานงานเขียนและงานที่เผยแพร่ทุกช่องทาง',
      'Hold the standard for writing and for everything published on every channel',
    ),
      bi(
      'ทำงานร่วมกับทีม SEO เพื่อให้เนื้อหาถูกค้นเจอ',
      'Work with the SEO team so the content gets found',
    ),
      bi(
      'ดูแลและพัฒนาทีมเนื้อหา 2–3 คน',
      'Lead and develop a content team of 2–3',
    ),
    ],
    requiredSkills: [
      { skillId: 'content-creation', level: 4.0 },
      { skillId: 'copywriting', level: 3.5 },
      { skillId: 'seo', level: 3.5 },
    ],
    preferredSkills: [{ skillId: 'leadership', level: 3.0 }],
    minExperience: 5,
    education: bi(
      'ปริญญาตรีสาขานิเทศศาสตร์ อักษรศาสตร์ การตลาด หรือสาขาที่เกี่ยวข้อง',
      'Bachelor’s in communications, humanities, marketing or a related field',
    ),
    employmentType: 'Full-time',
    location: bi(
      'กรุงเทพฯ (Hybrid 2 วัน/สัปดาห์)',
      'Bangkok (hybrid, 2 days a week)',
    ),
    salaryRange: { min: 60000, max: 85000, currency: 'THB' },
  },
  {
    id: 'job-sales-executive',
    title: 'Sales Executive',
    department: 'Sales',
    description: bi(
      'ดูแลลูกค้าธุรกิจขนาดกลาง ตั้งแต่การหาโอกาสใหม่จนถึงการปิดการขาย',
      'Handles mid-market business customers, from finding the opportunity to closing the sale',
    ),
    responsibilities: [
      bi(
      'หาและติดตามโอกาสการขายใหม่ในกลุ่มลูกค้าธุรกิจ',
      'Find and follow up new opportunities among business customers',
    ),
      bi(
      'นำเสนอโซลูชันให้ตรงกับปัญหาจริงของลูกค้า',
      'Pitch solutions against the customer’s real problem',
    ),
      bi(
      'ดูแลความสัมพันธ์กับลูกค้าเดิมให้ต่อสัญญา',
      'Keep existing customers close enough to renew',
    ),
    ],
    requiredSkills: [
      { skillId: 'client-handling', level: 3.5 },
      { skillId: 'presentation', level: 3.0 },
    ],
    preferredSkills: [{ skillId: 'market-research', level: 2.5 }],
    minExperience: 2,
    education: bi(
      'ปริญญาตรีทุกสาขา',
      'Bachelor’s in any field',
    ),
    employmentType: 'Full-time',
    location: bi(
      'กรุงเทพฯ (On-site)',
      'Bangkok (on-site)',
    ),
    salaryRange: { min: 35000, max: 55000, currency: 'THB' },
  },
]

const byId = new Map(JOBS.map((j) => [j.id, j]))

export function getJob(id: string): Job {
  const job = byId.get(id)
  if (!job) throw new Error(`Unknown job: ${id}`)
  return job
}
