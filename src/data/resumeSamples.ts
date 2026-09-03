import { bi } from '@/lib/i18n/types'

import type { Candidate, CandidateSkill } from './types'

/**
 * The Recruit screen's resume drop-zone is a simulation (§ no real backend
 * or LLM in this prototype) — it never reads the dropped file. What it does
 * instead is pick one of these pre-written outcomes, matched to whichever
 * job is currently selected, and build a real Candidate from it. Two per
 * job rather than one, so demoing the same job twice doesn't show the
 * identical result — still a small, fixed pool rather than anything
 * generated, so every outcome stays coherent and reviewable.
 *
 * Shape mirrors Candidate minus the two fields only known at drop-time
 * (`id`, `appliedJobId`).
 */
export type ResumeSample = Omit<Candidate, 'id' | 'appliedJobId'> & {
  /** Which job this sample was written to be a plausible match for. */
  targetJobId: string
}

const skill = (
  skillId: CandidateSkill['skillId'],
  level: number,
  extractedFrom: [string, string],
): CandidateSkill => ({ skillId, level, extractedFrom: bi(extractedFrom[0], extractedFrom[1]) })

export const RESUME_SAMPLES: ResumeSample[] = [
  // ── job-senior-data-analyst ────────────────────────────────────────────
  {
    name: 'กนกวรรณ ท.',
    nameLatin: 'Kanokwan T.',
    education: bi('ปริญญาโท วิทยาการข้อมูล', 'MSc Data Science'),
    yearsExperience: 6,
    targetJobId: 'job-senior-data-analyst',
    skills: [
      skill('data-analysis', 4.5, [
        'นำทีมวิเคราะห์ demand forecasting 3 โครงการ แปลงข้อมูลธุรกรรมดิบให้เป็นข้อเสนอด้านราคา',
        'Led analysis for 3 demand-forecasting initiatives, turning raw transaction data into pricing recommendations',
      ]),
      skill('sql', 4.6, [
        'เขียนและปรับแต่ง SQL บน data warehouse กว่า 200 ล้านแถวมาต่อเนื่อง 5 ปี',
        '5+ years writing and tuning SQL against a 200M-row data warehouse',
      ]),
      skill('ai-tools', 4.0, [
        'สร้างเครื่องมือ AI ช่วยสรุปรายงานอัตโนมัติ ลดเวลาทำรายงานประจำสัปดาห์ลงครึ่งหนึ่ง',
        'Built an AI-assisted reporting tool that cut weekly report turnaround in half',
      ]),
      skill('presentation', 3.4, [
        'นำเสนอผลวิเคราะห์ต่อผู้บริหารระดับสูงเป็นประจำทุกไตรมาส',
        'Presents analysis findings to senior leadership every quarter',
      ]),
    ],
    certifications: ['Google Data Analytics Certificate'],
    projects: [
      { name: 'Demand Forecasting Pipeline', skillsUsed: ['data-analysis', 'sql'] },
      { name: 'AI-Assisted Reporting Tool', skillsUsed: ['ai-tools', 'data-analysis'] },
    ],
    portfolio: 'kanokwan-data.example',
    assessmentScore: 90,
    avatarHue: 205,
  },
  {
    name: 'สมชาย ร.',
    nameLatin: 'Somchai R.',
    education: bi('ปริญญาตรี สถิติ', 'BSc Statistics'),
    yearsExperience: 4.5,
    targetJobId: 'job-senior-data-analyst',
    skills: [
      skill('data-analysis', 4.1, [
        'สร้างโมเดลทำนายการเลิกใช้บริการของลูกค้า ใช้ประกอบการตัดสินใจรักษาลูกค้า',
        'Built a customer-churn model used to guide retention decisions',
      ]),
      skill('sql', 4.3, [
        'ดูแลและจัดระเบียบ SQL warehouse ให้ทีมธุรกิจดึงรายงานเองได้',
        'Cleaned up the SQL warehouse so business teams could self-serve reports',
      ]),
      skill('ai-tools', 3.6, [
        'ใช้เครื่องมือ AI ช่วยร่างสรุปข้อมูลเบื้องต้นก่อนวิเคราะห์ต่อ',
        'Uses AI tooling to draft a first-pass summary before deeper analysis',
      ]),
      skill('presentation', 2.8, [
        'นำเสนอผลงานในที่ประชุมทีมเป็นประจำ',
        'Presents findings in regular team meetings',
      ]),
    ],
    certifications: [],
    projects: [
      { name: 'Customer Churn Model', skillsUsed: ['data-analysis'] },
      { name: 'SQL Warehouse Cleanup', skillsUsed: ['sql'] },
    ],
    assessmentScore: 82,
    avatarHue: 195,
  },

  // ── job-content-marketing-lead ──────────────────────────────────────────
  {
    name: 'พลอย ส.',
    nameLatin: 'Ploy S.',
    education: bi('ปริญญาตรี นิเทศศาสตร์', 'BA Communications'),
    yearsExperience: 7,
    targetJobId: 'job-content-marketing-lead',
    skills: [
      skill('content-creation', 4.4, [
        'วางแผนและผลิตเนื้อหาแบรนด์ทุกช่องทางมาต่อเนื่อง 4 ปี',
        'Has planned and produced brand content across every channel for 4 years running',
      ]),
      skill('copywriting', 4.0, [
        'เขียนแคมเปญที่ทำให้ยอดสมัครสมาชิกอีเมลเพิ่มขึ้น 30%',
        'Wrote a campaign that grew email sign-ups 30%',
      ]),
      skill('seo', 3.8, [
        'ทำงานร่วมกับทีม SEO จนเนื้อหาหลักติดหน้าแรกของการค้นหา',
        'Worked with the SEO team until the flagship content ranked on page one',
      ]),
      skill('leadership', 3.5, [
        'ดูแลและพัฒนาทีมเนื้อหา 3 คนมาสองปี',
        'Has led and developed a content team of 3 for two years',
      ]),
    ],
    certifications: ['HubSpot Content Marketing Certification'],
    projects: [
      { name: 'Brand Voice Refresh', skillsUsed: ['content-creation', 'copywriting'] },
      { name: 'Organic Traffic Growth Plan', skillsUsed: ['seo', 'content-creation'] },
    ],
    portfolio: 'ploy-writes.example',
    assessmentScore: 88,
    avatarHue: 320,
  },
  {
    name: 'ณัฐวุฒิ ค.',
    nameLatin: 'Nutthawut K.',
    education: bi('ปริญญาตรี วารสารศาสตร์', 'BA Journalism'),
    yearsExperience: 5.5,
    targetJobId: 'job-content-marketing-lead',
    skills: [
      skill('content-creation', 4.0, [
        'ปรับปรุงปฏิทินเนื้อหาให้ตรงตามเป้าการเติบโตของแบรนด์',
        'Overhauled the editorial calendar to match the brand’s growth targets',
      ]),
      skill('copywriting', 3.6, [
        'เขียนบทความและแคมเปญให้แบรนด์มากกว่า 100 ชิ้นในสองปี',
        'Has written 100+ articles and campaigns for the brand over two years',
      ]),
      skill('seo', 3.5, [
        'ตรวจสอบและปรับเนื้อหาเดิมให้ตรงหลัก SEO มากกว่า 50 บทความ',
        'Audited and re-optimized 50+ existing articles for SEO',
      ]),
      skill('leadership', 2.9, [
        'เริ่มดูแลนักเขียนฝึกงาน 1 คนในปีนี้',
        'Started mentoring one junior writer this year',
      ]),
    ],
    certifications: [],
    projects: [
      { name: 'Editorial Calendar Overhaul', skillsUsed: ['content-creation'] },
      { name: 'SEO Content Audit', skillsUsed: ['seo'] },
    ],
    assessmentScore: 79,
    avatarHue: 30,
  },

  // ── job-sales-executive ─────────────────────────────────────────────────
  {
    name: 'เฉลิมชัย พ.',
    nameLatin: 'Chalermchai P.',
    education: bi('ปริญญาตรี บริหารธุรกิจ การตลาด', 'BBA Marketing'),
    yearsExperience: 3,
    targetJobId: 'job-sales-executive',
    skills: [
      skill('client-handling', 4.0, [
        'ดูแลลูกค้าธุรกิจขนาดกลางกว่า 20 รายจนต่อสัญญาทุกราย',
        'Manages 20+ mid-market accounts with a 100% renewal record',
      ]),
      skill('presentation', 3.6, [
        'นำเสนอโซลูชันให้ลูกค้าใหม่เป็นประจำทุกสัปดาห์',
        'Pitches new-client solutions on a weekly cadence',
      ]),
      skill('market-research', 3.0, [
        'จัดทำรายงานเปรียบเทียบราคาคู่แข่งให้ทีมขายใช้ประกอบการเสนอราคา',
        'Produces competitor-pricing comparisons the sales team uses to quote',
      ]),
    ],
    certifications: [],
    projects: [
      { name: 'SME Account Growth', skillsUsed: ['client-handling'] },
      { name: 'Competitor Pricing Deck', skillsUsed: ['market-research', 'presentation'] },
    ],
    assessmentScore: 85,
    avatarHue: 150,
  },
  {
    name: 'วรุณี ล.',
    nameLatin: 'Warunee L.',
    education: bi('ปริญญาตรีทุกสาขา', 'Bachelor’s, any field'),
    yearsExperience: 2.5,
    targetJobId: 'job-sales-executive',
    skills: [
      skill('client-handling', 3.7, [
        'สร้างคู่มือ onboarding ลูกค้าใหม่ที่ทีมขายทั้งหมดใช้อยู่ปัจจุบัน',
        'Built the new-client onboarding playbook the whole sales team now uses',
      ]),
      skill('presentation', 3.2, [
        'ปรับปรุง sales pitch deck ให้ใช้ได้ทั้งภูมิภาค',
        'Reworked the regional sales pitch deck',
      ]),
      skill('market-research', 2.6, [
        'ช่วยรวบรวมข้อมูลตลาดให้ผู้จัดการฝ่ายขายใช้วางแผนรายไตรมาส',
        'Helps compile market data the sales manager uses for quarterly planning',
      ]),
    ],
    certifications: [],
    projects: [
      { name: 'New Client Onboarding Playbook', skillsUsed: ['client-handling'] },
      { name: 'Regional Sales Pitch Deck', skillsUsed: ['presentation'] },
    ],
    assessmentScore: 76,
    avatarHue: 165,
  },
]

/**
 * Two-per-job means "the same job twice in a row" needs to not repeat —
 * cycling on a counter rather than Math.random() keeps the demo
 * deterministic and reproducible, the same reasoning generateEmployees.ts
 * gives for avoiding randomness in the main dataset.
 */
export function pickResumeSample(jobId: string, draw: number): ResumeSample {
  const candidates = RESUME_SAMPLES.filter((s) => s.targetJobId === jobId)
  return candidates[draw % candidates.length]
}
