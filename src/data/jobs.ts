import type { Job } from './types'

/** §9.5 — the three open positions. */
export const JOBS: Job[] = [
  {
    id: 'job-senior-data-analyst',
    title: 'Senior Data Analyst',
    department: 'Data',
    description:
      'รับผิดชอบงานวิเคราะห์ข้อมูลเชิงลึกให้ทีมธุรกิจ และวางมาตรฐานการทำงานกับข้อมูลร่วมกับ Data Lead',
    responsibilities: [
      'ออกแบบและดูแลชุดข้อมูลหลักที่ทีมธุรกิจใช้ตัดสินใจ',
      'ทำงานวิเคราะห์เชิงลึกและสรุปเป็นข้อเสนอที่นำไปใช้ได้จริง',
      'ใช้เครื่องมือ AI ช่วยลดเวลาทำงานวิเคราะห์ประจำ',
      'ช่วยรีวิวงานของ Junior Data Analyst',
    ],
    requiredSkills: [
      { skillId: 'data-analysis', level: 4.0 },
      { skillId: 'sql', level: 4.0 },
      { skillId: 'ai-tools', level: 3.5 },
    ],
    preferredSkills: [{ skillId: 'presentation', level: 3.0 }],
    minExperience: 4,
    education: 'ปริญญาตรีสาขาสถิติ วิทยาการคอมพิวเตอร์ เศรษฐศาสตร์ หรือสาขาที่เกี่ยวข้อง',
    employmentType: 'Full-time',
    location: 'กรุงเทพฯ (Hybrid 3 วัน/สัปดาห์)',
    salaryRange: { min: 65000, max: 95000, currency: 'THB' },
  },
  {
    id: 'job-content-marketing-lead',
    title: 'Content Marketing Lead',
    department: 'Marketing',
    description:
      'ดูแลทิศทางเนื้อหาทั้งหมดของแบรนด์ ตั้งแต่แผนรายไตรมาสจนถึงมาตรฐานงานที่เผยแพร่จริง',
    responsibilities: [
      'วางแผนเนื้อหารายไตรมาสให้สอดคล้องกับเป้าการเติบโต',
      'ดูแลมาตรฐานงานเขียนและงานที่เผยแพร่ทุกช่องทาง',
      'ทำงานร่วมกับทีม SEO เพื่อให้เนื้อหาถูกค้นเจอ',
      'ดูแลและพัฒนาทีมเนื้อหา 2–3 คน',
    ],
    requiredSkills: [
      { skillId: 'content-creation', level: 4.0 },
      { skillId: 'copywriting', level: 3.5 },
      { skillId: 'seo', level: 3.5 },
    ],
    preferredSkills: [{ skillId: 'leadership', level: 3.0 }],
    minExperience: 5,
    education: 'ปริญญาตรีสาขานิเทศศาสตร์ อักษรศาสตร์ การตลาด หรือสาขาที่เกี่ยวข้อง',
    employmentType: 'Full-time',
    location: 'กรุงเทพฯ (Hybrid 2 วัน/สัปดาห์)',
    salaryRange: { min: 60000, max: 85000, currency: 'THB' },
  },
  {
    id: 'job-sales-executive',
    title: 'Sales Executive',
    department: 'Sales',
    description: 'ดูแลลูกค้าธุรกิจขนาดกลาง ตั้งแต่การหาโอกาสใหม่จนถึงการปิดการขาย',
    responsibilities: [
      'หาและติดตามโอกาสการขายใหม่ในกลุ่มลูกค้าธุรกิจ',
      'นำเสนอโซลูชันให้ตรงกับปัญหาจริงของลูกค้า',
      'ดูแลความสัมพันธ์กับลูกค้าเดิมให้ต่อสัญญา',
    ],
    requiredSkills: [
      { skillId: 'client-handling', level: 3.5 },
      { skillId: 'presentation', level: 3.0 },
    ],
    preferredSkills: [{ skillId: 'market-research', level: 2.5 }],
    minExperience: 2,
    education: 'ปริญญาตรีทุกสาขา',
    employmentType: 'Full-time',
    location: 'กรุงเทพฯ (On-site)',
    salaryRange: { min: 35000, max: 55000, currency: 'THB' },
  },
]

const byId = new Map(JOBS.map((j) => [j.id, j]))

export function getJob(id: string): Job {
  const job = byId.get(id)
  if (!job) throw new Error(`Unknown job: ${id}`)
  return job
}
