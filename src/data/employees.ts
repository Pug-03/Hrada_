import { bi, type LocalizedText } from '@/lib/i18n/types'

import { HISTORY_MONTHS } from './dates'
import { generateSyntheticEmployees } from './generateEmployees'
import type {
  Employee,
  Evidence,
  EvidenceKind,
  EmployeeSkill,
  SkillHistoryPoint,
  SkillId,
} from './types'

export { HISTORY_MONTHS }

/**
 * Evidence detail is bilingual. Project names, certifications and assessment
 * scores are proper nouns and read the same either way, so a plain string is
 * accepted and used for both locales; prose gets an explicit pair.
 */
const ev = (kind: EvidenceKind, detail: string | LocalizedText, year: number): Evidence => ({
  kind,
  detail: typeof detail === 'string' ? bi(detail, detail) : detail,
  year,
})

const sk = (skillId: SkillId, level: number, evidence: Evidence[] = []): EmployeeSkill => ({
  skillId,
  level,
  evidence,
})

const hist = (...levels: number[]): SkillHistoryPoint[] =>
  HISTORY_MONTHS.map((month, i) => ({ month, level: levels[i] }))

/**
 * The 14 hand-authored people from §9.3. Levels marked there are locked
 * verbatim; every other skill sits in the 1.0–3.0 filler range the spec
 * allows, chosen to match the person's actual job.
 *
 * The rest of the roster — everyone from emp-15 on — is deterministically
 * generated in generateEmployees.ts, so a change here can never accidentally
 * touch these 14.
 *
 * Evidence rule (§9.3): any skill at 3.0 or above carries at least two
 * independent sources. Below 3.0 evidence is optional and often absent —
 * that absence is itself meaningful and the UI says so.
 */
const HAND_AUTHORED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    name: 'เจนจิรา ว.',
    nameLatin: 'Jenjira W.',
    title: 'Marketing Executive',
    department: 'Marketing',
    employmentType: 'Full-time',
    performance: 4.2,
    workload: 72,
    careerGoalRoleId: 'marketing-manager',
    yearsInRole: 3,
    yearsExperience: 6,
    avatarHue: 210,
    skills: [
      sk('digital-marketing', 4.5, [
        ev('Project', 'Rebrand Launch Q4', 2025),
        ev('Certification', 'Google Ads Search Professional', 2025),
        ev('Manager Review', bi('ทำแคมเปญได้เองทั้งวงจร', 'Runs a campaign end to end alone'), 2025),
      ]),
      sk('content-creation', 4.1, [
        ev('Project', 'Content Engine 2025', 2025),
        ev('Peer Feedback', bi('ทีมขอให้ช่วยรีวิวงานเขียนประจำ', 'The team routinely asks them to review writing'), 2025),
      ]),
      sk('client-handling', 4.0, [
        ev('Project', 'Retail Client Onboarding', 2025),
        ev('Manager Review', bi('ลูกค้ารายใหญ่ขอทำงานด้วยต่อเนื่อง', 'Major clients ask to keep working with them'), 2024),
      ]),
      sk('data-analysis', 3.2, [
        ev('Assessment', 'Marketing Analytics 74/100', 2026),
        ev('Project', 'Campaign ROI Review', 2025),
      ]),
      sk('leadership', 2.1, [ev('Peer Feedback', bi('เริ่มช่วยดูแลน้องฝึกงาน', 'Has started mentoring the intern'), 2026)]),
      sk('presentation', 2.9),
      sk('seo', 2.9),
      sk('copywriting', 2.8),
      sk('market-research', 2.5),
      sk('project-management', 2.4),
      sk('ai-tools', 2.3),
      sk('graphic-design', 2.0),
    ],
    projects: [
      {
        name: 'Rebrand Launch Q4',
        role: 'Campaign Owner',
        year: 2025,
        skillsUsed: ['digital-marketing', 'content-creation', 'client-handling'],
        crossDepartment: true,
      },
      {
        name: 'Campaign ROI Review',
        role: 'Analyst',
        year: 2025,
        skillsUsed: ['data-analysis', 'digital-marketing'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Marketing Analytics Foundations',
        type: 'Course',
        targetSkill: 'data-analysis',
        completedOn: '2026-04-18',
        levelBefore: 2.7,
        levelAfter: 3.2,
      },
    ],
    skillHistory: {
      'digital-marketing': hist(4.3, 4.3, 4.4, 4.4, 4.5, 4.5),
      'content-creation': hist(4.0, 4.0, 4.0, 4.1, 4.1, 4.1),
      'data-analysis': hist(2.7, 2.8, 3.0, 3.1, 3.1, 3.2),
    },
  },
  {
    id: 'emp-02',
    name: 'ปิยะ ส.',
    nameLatin: 'Piya S.',
    title: 'Data Lead',
    department: 'Data',
    employmentType: 'Full-time',
    performance: 4.6,
    workload: 92,
    careerGoalRoleId: 'head-of-data',
    yearsInRole: 3,
    yearsExperience: 9,
    avatarHue: 190,
    skills: [
      sk('data-analysis', 4.8, [
        ev('Project', 'Customer Segmentation Model', 2025),
        ev('Certification', 'Advanced Analytics Practitioner', 2024),
        ev('Manager Review', bi('เป็นคนตั้งมาตรฐานการวิเคราะห์ของบริษัท', 'Sets the company’s analysis standard'), 2025),
      ]),
      sk('sql', 4.7, [
        ev('Project', 'Warehouse Migration', 2025),
        ev('Assessment', 'SQL Proficiency 96/100', 2025),
      ]),
      sk('ai-tools', 3.9, [
        ev('Project', 'Forecast Automation Pilot', 2026),
        ev('Peer Feedback', bi('ทีมมาปรึกษาเรื่องการใช้เครื่องมือ AI', 'The team comes to them about AI tooling'), 2026),
      ]),
      sk('leadership', 3.4, [
        ev('Manager Review', bi('ดูแลทีม Data 3 คน', 'Leads a Data team of 3'), 2025),
        ev('Peer Feedback', bi('ตัดสินใจแทนทีมได้เวลางานเร่ง', 'Decides for the team when the work is urgent'), 2025),
      ]),
      sk('presentation', 2.9),
      sk('project-management', 2.8),
      sk('software-development', 2.7),
      sk('financial-analysis', 2.6),
      sk('coaching', 2.4),
      sk('market-research', 2.0),
    ],
    projects: [
      {
        name: 'Customer Segmentation Model',
        role: 'Lead',
        year: 2025,
        skillsUsed: ['data-analysis', 'sql'],
        crossDepartment: true,
      },
      {
        name: 'Warehouse Migration',
        role: 'Lead',
        year: 2025,
        skillsUsed: ['sql', 'software-development'],
        crossDepartment: false,
      },
      {
        name: 'Forecast Automation Pilot',
        role: 'Lead',
        year: 2026,
        skillsUsed: ['ai-tools', 'data-analysis'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Applied LLM Tooling',
        type: 'Workshop',
        targetSkill: 'ai-tools',
        completedOn: '2026-05-22',
        levelBefore: 3.4,
        levelAfter: 3.9,
      },
    ],
    skillHistory: {
      'data-analysis': hist(4.7, 4.7, 4.8, 4.8, 4.8, 4.8),
      sql: hist(4.6, 4.6, 4.7, 4.7, 4.7, 4.7),
      'ai-tools': hist(3.4, 3.5, 3.6, 3.8, 3.9, 3.9),
    },
  },
  {
    id: 'emp-03',
    name: 'มาร์ค ช.',
    nameLatin: 'Mark C.',
    title: 'Growth Marketer',
    department: 'Marketing',
    employmentType: 'Full-time',
    performance: 4.0,
    workload: 65,
    careerGoalRoleId: 'growth-lead',
    yearsInRole: 2.5,
    yearsExperience: 5,
    avatarHue: 225,
    skills: [
      sk('seo', 3.8, [
        ev('Project', 'Organic Traffic Recovery', 2025),
        ev('Certification', 'Technical SEO Specialist', 2024),
      ]),
      sk('digital-marketing', 3.6, [
        ev('Project', 'Paid Acquisition Revamp', 2025),
        ev('Manager Review', bi('คุมงบโฆษณาได้เองแล้ว', 'Runs the ad budget unaided now'), 2025),
      ]),
      sk('data-analysis', 3.5, [
        ev('Project', 'Funnel Diagnostics', 2026),
        ev('Assessment', 'Growth Analytics 81/100', 2026),
      ]),
      sk('content-creation', 3.4, [
        ev('Project', 'Organic Traffic Recovery', 2025),
        ev('Peer Feedback', bi('เขียน brief ให้ทีม content ได้ชัด', 'Writes clear briefs for the content team'), 2025),
      ]),
      sk('client-handling', 3.3, [
        ev('Project', 'Partner Co-marketing', 2025),
        ev('Manager Review', bi('คุยกับพาร์ทเนอร์ได้เอง', 'Handles partner conversations alone'), 2025),
      ]),
      sk('copywriting', 2.9),
      sk('ai-tools', 2.8),
      sk('market-research', 2.7),
      sk('presentation', 2.6),
      sk('sql', 2.4),
      sk('project-management', 2.3),
      sk('leadership', 2.2),
    ],
    projects: [
      {
        name: 'Organic Traffic Recovery',
        role: 'Owner',
        year: 2025,
        skillsUsed: ['seo', 'content-creation'],
        crossDepartment: false,
      },
      {
        name: 'Funnel Diagnostics',
        role: 'Analyst',
        year: 2026,
        skillsUsed: ['data-analysis', 'digital-marketing'],
        crossDepartment: true,
      },
      {
        name: 'Partner Co-marketing',
        role: 'Coordinator',
        year: 2025,
        skillsUsed: ['client-handling', 'digital-marketing'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Experimentation & A/B Testing',
        type: 'Course',
        targetSkill: 'data-analysis',
        completedOn: '2026-03-30',
        levelBefore: 3.0,
        levelAfter: 3.5,
      },
    ],
    skillHistory: {
      seo: hist(3.6, 3.6, 3.7, 3.7, 3.8, 3.8),
      'digital-marketing': hist(3.4, 3.5, 3.5, 3.6, 3.6, 3.6),
      'data-analysis': hist(3.0, 3.1, 3.3, 3.4, 3.4, 3.5),
    },
  },
  {
    id: 'emp-04',
    name: 'อารยา ต.',
    nameLatin: 'Araya T.',
    title: 'Content Specialist',
    department: 'Marketing',
    employmentType: 'Full-time',
    performance: 4.3,
    workload: 70,
    careerGoalRoleId: 'creative-lead',
    yearsInRole: 2,
    yearsExperience: 7,
    avatarHue: 265,
    skills: [
      sk('content-creation', 4.6, [
        ev('Project', 'Content Engine 2025', 2025),
        ev('Manager Review', bi('เป็นคนกำหนด tone ของแบรนด์', 'Sets the brand’s tone of voice'), 2025),
        ev('Peer Feedback', bi('ทุกทีมส่งงานให้ตรวจก่อนเผยแพร่', 'Every team sends work past them before it ships'), 2026),
      ]),
      sk('copywriting', 4.4, [
        ev('Project', 'Rebrand Launch Q4', 2025),
        ev('Assessment', 'Copy Craft Review 92/100', 2025),
      ]),
      sk('graphic-design', 3.5, [
        ev('Project', 'Social Template System', 2025),
        ev('Peer Feedback', bi('ทำ template ให้ทีมใช้ต่อได้', 'Built templates the team still works from'), 2025),
      ]),
      sk('digital-marketing', 2.9),
      sk('presentation', 2.6),
      sk('ai-tools', 2.5),
      sk('seo', 2.4),
      sk('client-handling', 2.3),
      sk('market-research', 2.1),
      sk('project-management', 2.0),
      sk('leadership', 1.9),
    ],
    projects: [
      {
        name: 'Content Engine 2025',
        role: 'Lead Writer',
        year: 2025,
        skillsUsed: ['content-creation', 'copywriting'],
        crossDepartment: false,
      },
      {
        name: 'Social Template System',
        role: 'Designer',
        year: 2025,
        skillsUsed: ['graphic-design', 'content-creation'],
        crossDepartment: false,
      },
    ],
    learningHistory: [
      {
        title: 'Editorial Direction Workshop',
        type: 'Workshop',
        targetSkill: 'content-creation',
        completedOn: '2026-04-02',
        levelBefore: 4.3,
        levelAfter: 4.6,
      },
    ],
    skillHistory: {
      'content-creation': hist(4.3, 4.4, 4.4, 4.5, 4.6, 4.6),
      copywriting: hist(4.3, 4.3, 4.4, 4.4, 4.4, 4.4),
      'graphic-design': hist(3.3, 3.3, 3.4, 3.4, 3.5, 3.5),
    },
  },
  {
    id: 'emp-05',
    name: 'ธนกร ม.',
    nameLatin: 'Thanakorn M.',
    title: 'Junior Data Analyst',
    department: 'Data',
    employmentType: 'Full-time',
    performance: 3.6,
    workload: 58,
    careerGoalRoleId: 'data-analyst',
    yearsInRole: 1,
    yearsExperience: 1.5,
    avatarHue: 175,
    skills: [
      sk('sql', 2.9, [ev('Assessment', 'SQL Fundamentals 78/100', 2026)]),
      sk('data-analysis', 2.6),
      sk('ai-tools', 2.2),
      sk('software-development', 1.9),
      sk('presentation', 1.8),
      sk('financial-analysis', 1.6),
      sk('market-research', 1.5),
    ],
    projects: [
      {
        name: 'Warehouse Migration',
        role: 'Support Analyst',
        year: 2026,
        skillsUsed: ['sql'],
        crossDepartment: false,
      },
    ],
    learningHistory: [
      {
        title: 'SQL for Analysts',
        type: 'Course',
        targetSkill: 'sql',
        completedOn: '2026-04-11',
        levelBefore: 2.2,
        levelAfter: 2.7,
      },
      {
        title: 'Warehouse Migration (on-the-job)',
        type: 'On-the-job',
        targetSkill: 'sql',
        completedOn: '2026-07-28',
        levelBefore: 2.7,
        levelAfter: 2.9,
      },
    ],
    skillHistory: {
      sql: hist(2.0, 2.2, 2.4, 2.5, 2.7, 2.9),
      'data-analysis': hist(1.8, 2.0, 2.1, 2.3, 2.4, 2.6),
      'ai-tools': hist(1.4, 1.6, 1.7, 1.9, 2.0, 2.2),
    },
  },
  {
    id: 'emp-06',
    name: 'สุชาดา ก.',
    nameLatin: 'Suchada K.',
    title: 'HR Manager',
    department: 'Operations',
    employmentType: 'Full-time',
    performance: 4.4,
    workload: 76,
    careerGoalRoleId: 'hr-director',
    yearsInRole: 4,
    yearsExperience: 11,
    avatarHue: 300,
    skills: [
      sk('coaching', 4.2, [
        ev('Project', 'Manager Coaching Circle', 2025),
        ev('Certification', 'ICF Associate Coach', 2023),
        ev('Peer Feedback', bi('หัวหน้าทีมอื่นขอคำปรึกษาประจำ', 'Other team leads consult them regularly'), 2026),
      ]),
      sk('leadership', 4.0, [
        ev('Manager Review', bi('ดูแลงานคนทั้งบริษัท 126 คน', 'Looks after people matters for all 126 staff'), 2025),
        ev('Project', 'Performance Cycle Redesign', 2025),
      ]),
      sk('presentation', 3.8, [
        ev('Project', 'Town Hall Program', 2025),
        ev('Peer Feedback', bi('สื่อสารเรื่องยากให้เข้าใจง่าย', 'Makes difficult topics easy to follow'), 2025),
      ]),
      sk('project-management', 3.2, [
        ev('Project', 'Performance Cycle Redesign', 2025),
        ev('Manager Review', bi('ปิดโครงการตรงเวลาทุกรอบ', 'Closes every project cycle on time'), 2025),
      ]),
      sk('client-handling', 2.9),
      sk('financial-analysis', 2.3),
      sk('data-analysis', 2.1),
      sk('content-creation', 2.0),
      sk('market-research', 2.0),
    ],
    projects: [
      {
        name: 'Performance Cycle Redesign',
        role: 'Owner',
        year: 2025,
        skillsUsed: ['project-management', 'leadership'],
        crossDepartment: true,
      },
      {
        name: 'Manager Coaching Circle',
        role: 'Facilitator',
        year: 2025,
        skillsUsed: ['coaching', 'presentation'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Workforce Budgeting Basics',
        type: 'Course',
        targetSkill: 'financial-analysis',
        completedOn: '2026-06-15',
        levelBefore: 2.0,
        levelAfter: 2.3,
      },
    ],
    skillHistory: {
      coaching: hist(4.1, 4.1, 4.2, 4.2, 4.2, 4.2),
      leadership: hist(3.9, 3.9, 3.9, 4.0, 4.0, 4.0),
      presentation: hist(3.7, 3.7, 3.7, 3.8, 3.8, 3.8),
    },
  },
  {
    id: 'emp-07',
    name: 'วิชัย พ.',
    nameLatin: 'Wichai P.',
    title: 'Sales Manager',
    department: 'Sales',
    employmentType: 'Full-time',
    performance: 4.4,
    workload: 88,
    careerGoalRoleId: 'sales-director',
    yearsInRole: 3.5,
    yearsExperience: 12,
    avatarHue: 20,
    skills: [
      sk('client-handling', 4.6, [
        ev('Project', 'Enterprise Renewal Push', 2025),
        ev('Manager Review', bi('รักษาลูกค้ารายใหญ่ไว้ได้ทั้งหมด', 'Retained every major account'), 2025),
        ev('Peer Feedback', bi('ทีมขายเอาวิธีของเขาไปใช้ต่อ', 'The sales team adopted their approach'), 2026),
      ]),
      sk('presentation', 4.2, [
        ev('Project', 'Enterprise Renewal Push', 2025),
        ev('Assessment', 'Client Pitch Review 90/100', 2025),
      ]),
      sk('leadership', 3.9, [
        ev('Manager Review', bi('ดูแลทีมขาย 6 คน', 'Leads a sales team of 6'), 2025),
        ev('Project', 'Sales Playbook v2', 2026),
      ]),
      sk('market-research', 3.0, [
        ev('Project', 'Competitive Pricing Study', 2025),
        ev('Peer Feedback', bi('ให้ข้อมูลตลาดกับทีม Product', 'Feeds market intelligence to the Product team'), 2025),
      ]),
      sk('coaching', 2.9),
      sk('project-management', 2.7),
      sk('financial-analysis', 2.4),
      sk('digital-marketing', 2.2),
      sk('data-analysis', 2.1),
    ],
    projects: [
      {
        name: 'Enterprise Renewal Push',
        role: 'Lead',
        year: 2025,
        skillsUsed: ['client-handling', 'presentation'],
        crossDepartment: false,
      },
      {
        name: 'Competitive Pricing Study',
        role: 'Contributor',
        year: 2025,
        skillsUsed: ['market-research'],
        crossDepartment: true,
      },
      {
        name: 'Sales Playbook v2',
        role: 'Owner',
        year: 2026,
        skillsUsed: ['leadership', 'client-handling'],
        crossDepartment: false,
      },
    ],
    learningHistory: [
      {
        title: 'Coaching for Sales Leaders',
        type: 'Mentorship',
        targetSkill: 'coaching',
        completedOn: '2026-05-09',
        levelBefore: 2.6,
        levelAfter: 2.9,
      },
    ],
    skillHistory: {
      'client-handling': hist(4.5, 4.5, 4.6, 4.6, 4.6, 4.6),
      presentation: hist(4.1, 4.1, 4.2, 4.2, 4.2, 4.2),
      leadership: hist(3.7, 3.8, 3.8, 3.9, 3.9, 3.9),
    },
  },
  {
    id: 'emp-08',
    name: 'ณิชา อ.',
    nameLatin: 'Nicha A.',
    title: 'Sales Executive',
    department: 'Sales',
    employmentType: 'Contract',
    performance: 3.4,
    workload: 62,
    careerGoalRoleId: 'senior-sales-executive',
    yearsInRole: 2,
    yearsExperience: 3,
    avatarHue: 40,
    skills: [
      sk('client-handling', 3.3, [
        ev('Project', 'SMB Outbound Sprint', 2026),
        ev('Manager Review', bi('ดูแลลูกค้ารายเล็กได้เอง', 'Handles smaller accounts alone'), 2025),
      ]),
      sk('presentation', 3.0, [
        ev('Assessment', 'Pitch Review 72/100', 2026),
        ev('Peer Feedback', bi('นำเสนอได้ดีขึ้นชัดเจนหลังฝึก', 'Presenting improved markedly after training'), 2026),
      ]),
      sk('market-research', 2.4),
      sk('content-creation', 2.2),
      sk('copywriting', 2.0),
      sk('digital-marketing', 1.9),
      sk('project-management', 1.8),
      sk('coaching', 1.6),
    ],
    projects: [
      {
        name: 'SMB Outbound Sprint',
        role: 'Executive',
        year: 2026,
        skillsUsed: ['client-handling'],
        crossDepartment: false,
      },
    ],
    /**
     * §9.4 case 6 — two completed Client Handling courses this year moved the
     * level from 3.2 to 3.3. calcLearningOutcome flags that as low outcome.
     */
    learningHistory: [
      {
        title: 'Client Conversations That Convert',
        type: 'Course',
        targetSkill: 'client-handling',
        completedOn: '2026-03-20',
        levelBefore: 3.2,
        levelAfter: 3.25,
      },
      {
        title: 'Objection Handling Essentials',
        type: 'Course',
        targetSkill: 'client-handling',
        completedOn: '2026-06-27',
        levelBefore: 3.25,
        levelAfter: 3.3,
      },
    ],
    skillHistory: {
      'client-handling': hist(3.2, 3.2, 3.25, 3.25, 3.3, 3.3),
      presentation: hist(2.8, 2.9, 2.9, 3.0, 3.0, 3.0),
      'market-research': hist(2.2, 2.2, 2.3, 2.3, 2.4, 2.4),
    },
  },
  {
    id: 'emp-09',
    name: 'กิตติ ร.',
    nameLatin: 'Kitti R.',
    title: 'Product Manager',
    department: 'Product',
    employmentType: 'Full-time',
    performance: 4.3,
    workload: 80,
    careerGoalRoleId: 'head-of-product',
    yearsInRole: 2,
    yearsExperience: 8,
    avatarHue: 145,
    skills: [
      sk('product-management', 4.4, [
        ev('Project', 'Self-serve Onboarding', 2025),
        ev('Manager Review', bi('ตัดสินใจ trade-off ของสินค้าได้เอง', 'Makes product trade-off calls unaided'), 2025),
        ev('Peer Feedback', bi('ทีมวิศวกรรมเข้าใจโจทย์ชัดขึ้นมาก', 'The engineering team understands the brief far better'), 2026),
      ]),
      sk('ux-research', 3.6, [
        ev('Project', 'Churn Interview Round', 2025),
        ev('Peer Feedback', bi('ตั้งคำถามสัมภาษณ์ได้คม', 'Frames sharp interview questions'), 2025),
      ]),
      sk('leadership', 3.5, [
        ev('Manager Review', bi('นำทีมข้ามสายงาน 5 คน', 'Led a cross-functional team of 5'), 2025),
        ev('Project', 'Self-serve Onboarding', 2025),
      ]),
      sk('data-analysis', 3.3, [
        ev('Project', 'Activation Funnel Study', 2026),
        ev('Assessment', 'Product Analytics 79/100', 2026),
      ]),
      sk('presentation', 3.0, [
        ev('Project', 'Quarterly Product Review', 2026),
        ev('Peer Feedback', bi('สรุปให้ผู้บริหารเข้าใจได้ใน 10 นาที', 'Can brief the executive team in 10 minutes'), 2026),
      ]),
      sk('project-management', 2.9),
      sk('market-research', 2.8),
      sk('ai-tools', 2.7),
      sk('client-handling', 2.6),
      sk('sql', 2.5),
      sk('software-development', 2.2),
    ],
    projects: [
      {
        name: 'Self-serve Onboarding',
        role: 'Product Owner',
        year: 2025,
        skillsUsed: ['product-management', 'leadership'],
        crossDepartment: true,
      },
      {
        name: 'Churn Interview Round',
        role: 'Interviewer',
        year: 2025,
        skillsUsed: ['ux-research'],
        crossDepartment: true,
      },
      {
        name: 'Activation Funnel Study',
        role: 'Analyst',
        year: 2026,
        skillsUsed: ['data-analysis', 'product-management'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Product Analytics Deep Dive',
        type: 'Course',
        targetSkill: 'data-analysis',
        completedOn: '2026-05-14',
        levelBefore: 2.9,
        levelAfter: 3.3,
      },
    ],
    skillHistory: {
      'product-management': hist(4.3, 4.3, 4.4, 4.4, 4.4, 4.4),
      'ux-research': hist(3.5, 3.5, 3.5, 3.6, 3.6, 3.6),
      'data-analysis': hist(2.9, 3.0, 3.1, 3.2, 3.3, 3.3),
    },
  },
  {
    id: 'emp-10',
    name: 'พิมพ์ชนก น.',
    nameLatin: 'Pimchanok N.',
    title: 'UX Researcher',
    department: 'Product',
    employmentType: 'Full-time',
    performance: 4.1,
    workload: 68,
    careerGoalRoleId: 'lead-researcher',
    yearsInRole: 2,
    yearsExperience: 5,
    avatarHue: 320,
    skills: [
      sk('ux-research', 4.5, [
        ev('Project', 'Churn Interview Round', 2025),
        ev('Certification', 'Human-Centered Research Practitioner', 2024),
        ev('Manager Review', bi('ออกแบบงานวิจัยเองได้ทั้งกระบวนการ', 'Designs the whole research process alone'), 2025),
      ]),
      sk('presentation', 3.4, [
        ev('Project', 'Research Readout Series', 2026),
        ev('Peer Feedback', bi('ทำให้ผลวิจัยกลายเป็นการตัดสินใจได้', 'Turns research findings into actual decisions'), 2026),
      ]),
      sk('market-research', 2.9),
      sk('data-analysis', 2.8),
      sk('content-creation', 2.4),
      sk('product-management', 2.3),
      sk('graphic-design', 2.1),
      sk('sql', 1.8),
    ],
    projects: [
      {
        name: 'Churn Interview Round',
        role: 'Lead Researcher',
        year: 2025,
        skillsUsed: ['ux-research'],
        crossDepartment: true,
      },
      {
        name: 'Research Readout Series',
        role: 'Presenter',
        year: 2026,
        skillsUsed: ['presentation', 'ux-research'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Storytelling for Researchers',
        type: 'Workshop',
        targetSkill: 'presentation',
        completedOn: '2026-04-24',
        levelBefore: 3.0,
        levelAfter: 3.4,
      },
    ],
    skillHistory: {
      'ux-research': hist(4.4, 4.4, 4.5, 4.5, 4.5, 4.5),
      presentation: hist(3.0, 3.1, 3.2, 3.3, 3.4, 3.4),
      'data-analysis': hist(2.6, 2.7, 2.7, 2.8, 2.8, 2.8),
    },
  },
  {
    id: 'emp-11',
    name: 'อนุชา ว.',
    nameLatin: 'Anucha W.',
    title: 'Software Developer',
    department: 'Product',
    employmentType: 'Full-time',
    performance: 4.2,
    workload: 84,
    careerGoalRoleId: 'tech-lead',
    yearsInRole: 3,
    yearsExperience: 7,
    avatarHue: 160,
    skills: [
      sk('software-development', 4.3, [
        ev('Project', 'Self-serve Onboarding', 2025),
        ev('Assessment', 'System Design Review 88/100', 2025),
        ev('Peer Feedback', bi('รีวิวโค้ดให้ทีมทั้งหมด', 'Reviews code for the whole team'), 2026),
      ]),
      sk('ai-tools', 3.7, [
        ev('Project', 'Forecast Automation Pilot', 2026),
        ev('Peer Feedback', bi('วางแนวทางใช้ AI ในการเขียนโค้ดให้ทีม', 'Set the team’s approach to AI-assisted coding'), 2026),
      ]),
      sk('sql', 3.4, [
        ev('Project', 'Warehouse Migration', 2025),
        ev('Manager Review', bi('เขียน query ที่ซับซ้อนได้เอง', 'Writes complex queries unaided'), 2025),
      ]),
      sk('data-analysis', 2.9),
      sk('project-management', 2.2),
      sk('presentation', 2.0),
      sk('product-management', 1.9),
      sk('leadership', 1.7),
    ],
    projects: [
      {
        name: 'Self-serve Onboarding',
        role: 'Engineer',
        year: 2025,
        skillsUsed: ['software-development'],
        crossDepartment: true,
      },
      {
        name: 'Forecast Automation Pilot',
        role: 'Engineer',
        year: 2026,
        skillsUsed: ['ai-tools', 'software-development'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'AI-Assisted Engineering',
        type: 'Workshop',
        targetSkill: 'ai-tools',
        completedOn: '2026-06-05',
        levelBefore: 3.3,
        levelAfter: 3.7,
      },
    ],
    skillHistory: {
      'software-development': hist(4.2, 4.2, 4.3, 4.3, 4.3, 4.3),
      'ai-tools': hist(3.3, 3.4, 3.5, 3.6, 3.7, 3.7),
      sql: hist(3.3, 3.3, 3.4, 3.4, 3.4, 3.4),
    },
  },
  {
    id: 'emp-12',
    name: 'เมธี จ.',
    nameLatin: 'Methee J.',
    title: 'Ops Coordinator',
    department: 'Operations',
    employmentType: 'Full-time',
    performance: 3.5,
    workload: 66,
    careerGoalRoleId: 'ops-manager',
    yearsInRole: 2.5,
    yearsExperience: 4,
    avatarHue: 95,
    skills: [
      sk('project-management', 3.6, [
        ev('Project', 'Vendor Consolidation', 2025),
        ev('Manager Review', bi('คุมตารางงานหลายทีมพร้อมกันได้', 'Keeps several teams’ schedules moving at once'), 2025),
      ]),
      sk('client-handling', 3.0, [
        ev('Project', 'Vendor Consolidation', 2025),
        ev('Peer Feedback', bi('ประสานกับซัพพลายเออร์ได้ราบรื่น', 'Coordinates with suppliers smoothly'), 2025),
      ]),
      sk('presentation', 2.8),
      sk('financial-analysis', 2.3),
      sk('data-analysis', 2.2),
      sk('leadership', 2.1),
      sk('coaching', 2.0),
      sk('market-research', 1.8),
    ],
    projects: [
      {
        name: 'Vendor Consolidation',
        role: 'Coordinator',
        year: 2025,
        skillsUsed: ['project-management', 'client-handling'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'Project Management Essentials',
        type: 'Course',
        targetSkill: 'project-management',
        completedOn: '2026-04-30',
        levelBefore: 3.2,
        levelAfter: 3.6,
      },
    ],
    skillHistory: {
      'project-management': hist(3.2, 3.3, 3.4, 3.5, 3.6, 3.6),
      'client-handling': hist(2.9, 2.9, 3.0, 3.0, 3.0, 3.0),
      presentation: hist(2.6, 2.7, 2.7, 2.8, 2.8, 2.8),
    },
  },
  {
    id: 'emp-13',
    name: 'ศิริพร ล.',
    nameLatin: 'Siriporn L.',
    title: 'Financial Analyst',
    department: 'Operations',
    employmentType: 'Full-time',
    performance: 4.2,
    workload: 74,
    careerGoalRoleId: 'finance-manager',
    yearsInRole: 3,
    yearsExperience: 6,
    avatarHue: 55,
    skills: [
      sk('financial-analysis', 4.4, [
        ev('Project', 'Unit Economics Rebuild', 2025),
        ev('Certification', 'CFA Level II', 2024),
        ev('Manager Review', bi('ปิดงบและอธิบายให้ทีมธุรกิจเข้าใจได้', 'Closes the books and explains them to the business'), 2025),
      ]),
      sk('data-analysis', 3.6, [
        ev('Project', 'Unit Economics Rebuild', 2025),
        ev('Assessment', 'Financial Modelling 85/100', 2025),
      ]),
      sk('sql', 3.1, [
        ev('Project', 'Revenue Reporting Automation', 2026),
        ev('Peer Feedback', bi('ดึงข้อมูลเองได้ ไม่ต้องรอทีม Data', 'Pulls their own data without waiting on the Data team'), 2026),
      ]),
      sk('presentation', 2.7),
      sk('market-research', 2.6),
      sk('project-management', 2.5),
      sk('ai-tools', 2.1),
      sk('leadership', 2.0),
    ],
    projects: [
      {
        name: 'Unit Economics Rebuild',
        role: 'Owner',
        year: 2025,
        skillsUsed: ['financial-analysis', 'data-analysis'],
        crossDepartment: true,
      },
      {
        name: 'Revenue Reporting Automation',
        role: 'Analyst',
        year: 2026,
        skillsUsed: ['sql', 'financial-analysis'],
        crossDepartment: true,
      },
    ],
    learningHistory: [
      {
        title: 'SQL for Finance Teams',
        type: 'Course',
        targetSkill: 'sql',
        completedOn: '2026-03-18',
        levelBefore: 2.6,
        levelAfter: 3.1,
      },
    ],
    skillHistory: {
      'financial-analysis': hist(4.3, 4.3, 4.4, 4.4, 4.4, 4.4),
      'data-analysis': hist(3.5, 3.5, 3.6, 3.6, 3.6, 3.6),
      sql: hist(2.6, 2.8, 2.9, 3.0, 3.1, 3.1),
    },
  },
  {
    id: 'emp-14',
    name: 'ภูมิ ต.',
    nameLatin: 'Phum T.',
    title: 'Marketing Intern',
    department: 'Marketing',
    employmentType: 'Intern',
    performance: 3.8,
    workload: 45,
    careerGoalRoleId: 'marketing-executive',
    yearsInRole: 0.5,
    yearsExperience: 0.5,
    avatarHue: 245,
    skills: [
      sk('ai-tools', 2.6, [ev('Assessment', 'AI Tooling Basics 76/100', 2026)]),
      sk('content-creation', 2.4),
      sk('digital-marketing', 2.0),
      sk('copywriting', 1.9),
      sk('seo', 1.8),
      sk('graphic-design', 1.7),
      sk('presentation', 1.5),
    ],
    projects: [
      {
        name: 'Content Engine 2025',
        role: 'Assistant',
        year: 2026,
        skillsUsed: ['content-creation'],
        crossDepartment: false,
      },
    ],
    learningHistory: [
      {
        title: 'Prompting for Marketers',
        type: 'Course',
        targetSkill: 'ai-tools',
        completedOn: '2026-05-02',
        levelBefore: 2.1,
        levelAfter: 2.5,
      },
      {
        title: 'Content Engine (on-the-job)',
        type: 'On-the-job',
        targetSkill: 'content-creation',
        completedOn: '2026-08-12',
        levelBefore: 2.1,
        levelAfter: 2.4,
      },
    ],
    skillHistory: {
      'ai-tools': hist(1.8, 2.0, 2.1, 2.3, 2.5, 2.6),
      'content-creation': hist(1.6, 1.8, 1.9, 2.1, 2.3, 2.4),
      'digital-marketing': hist(1.2, 1.4, 1.6, 1.7, 1.9, 2.0),
    },
  },
]

/**
 * The full roster — the 14 people the spec locks verbatim, plus a
 * deterministically generated population rounding the org out to the
 * approved department distribution (Marketing 10, Sales 11, Data 8,
 * Product 13, Operations 8 — 50 total). See generateEmployees.ts for how
 * and why the generated ids pick up at emp-15.
 */
export const EMPLOYEES: Employee[] = [
  ...HAND_AUTHORED_EMPLOYEES,
  ...generateSyntheticEmployees(HAND_AUTHORED_EMPLOYEES.length + 1),
]

const byId = new Map(EMPLOYEES.map((e) => [e.id, e]))

export function getEmployee(id: string): Employee {
  const employee = byId.get(id)
  if (!employee) throw new Error(`Unknown employee: ${id}`)
  return employee
}

export function skillLevel(employee: Employee, skillId: SkillId): number {
  return employee.skills.find((s) => s.skillId === skillId)?.level ?? 0
}

/**
 * §9.1 named the company at 126 people with 14 shown, a small sample of a
 * bigger org. That ratio does not hold at any other modeled size — it was
 * calibrated to 14. At 50 modeled (14 hand-authored + 36 generated), 56
 * keeps the same "small, believable gap" framing (people on leave, recent
 * hires not yet onboarded) rather than a stale ratio or a total exactly
 * equal to what is modeled.
 */
export const ORG = {
  name: 'ธนาวัฒน์ ดิจิทัล',
  nameLatin: 'Thanawat Digital',
  industry: 'Digital Services',
  totalHeadcount: 56,
  departments: ['Marketing', 'Sales', 'Data', 'Product', 'Operations'] as const,
}
