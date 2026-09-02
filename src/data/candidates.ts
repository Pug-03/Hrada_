import { bi } from '@/lib/i18n/types'

import type { Candidate } from './types'

/**
 * §9.6 — eight external candidates, shaped so the ranking screen shows the
 * four situations the spec asks for:
 *   (a) cand-01 — highest total score, but AI Tools sits 1.5 below the bar,
 *       so hasCriticalGap fires and the score alone would mislead.
 *   (b) cand-02 — meets every required skill exactly, ranks mid-pack.
 *   (c) cand-03 — 1.5 years of experience, assessment 96.
 *   (d) cand-04 and cand-06 — clearly low scores that stay on the list with
 *       decision buttons, because nothing in HRADA auto-rejects a person.
 */
export const CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    name: 'ณัฐพงษ์ ค.',
    nameLatin: 'Natthapong K.',
    education: bi('ปริญญาโท สถิติประยุกต์', 'MSc Applied Statistics'),
    yearsExperience: 6,
    skills: [
      { skillId: 'data-analysis', level: 4.6 },
      { skillId: 'sql', level: 4.5 },
      { skillId: 'ai-tools', level: 2.0 },
      { skillId: 'presentation', level: 3.8 },
      { skillId: 'financial-analysis', level: 3.2 },
    ],
    certifications: ['Advanced Analytics Practitioner', 'Tableau Desktop Specialist'],
    projects: [
      { name: 'Retail Demand Forecasting', skillsUsed: ['data-analysis', 'sql'] },
      { name: 'Executive Reporting Suite', skillsUsed: ['data-analysis', 'presentation'] },
      { name: 'Pricing Elasticity Study', skillsUsed: ['data-analysis'] },
    ],
    portfolio: 'natthapong-analytics.example',
    assessmentScore: 88,
    appliedJobId: 'job-senior-data-analyst',
    avatarHue: 200,
  },
  {
    id: 'cand-02',
    name: 'วรรณิศา ด.',
    nameLatin: 'Wannisa D.',
    education: bi('ปริญญาตรี วิทยาการคอมพิวเตอร์', 'BSc Computer Science'),
    yearsExperience: 3.5,
    skills: [
      { skillId: 'data-analysis', level: 4.0 },
      { skillId: 'sql', level: 4.0 },
      { skillId: 'ai-tools', level: 3.5 },
      { skillId: 'presentation', level: 2.2 },
    ],
    certifications: ['Google Data Analytics'],
    projects: [
      { name: 'Churn Dashboard', skillsUsed: ['data-analysis'] },
      { name: 'Internal Tooling Migration', skillsUsed: ['software-development'] },
      { name: 'Marketing Attribution Model', skillsUsed: ['market-research'] },
    ],
    assessmentScore: 68,
    appliedJobId: 'job-senior-data-analyst',
    avatarHue: 280,
  },
  {
    id: 'cand-03',
    name: 'ปกรณ์ ศ.',
    nameLatin: 'Pakorn S.',
    education: bi('ปริญญาตรี คณิตศาสตร์ประยุกต์', 'BSc Applied Mathematics'),
    yearsExperience: 1.5,
    skills: [
      { skillId: 'data-analysis', level: 3.6 },
      { skillId: 'sql', level: 3.8 },
      { skillId: 'ai-tools', level: 3.5 },
      { skillId: 'presentation', level: 2.8 },
      { skillId: 'software-development', level: 3.0 },
    ],
    certifications: ['dbt Analytics Engineering'],
    projects: [
      { name: 'Open Data Explorer', skillsUsed: ['data-analysis', 'sql'] },
      { name: 'LLM Query Assistant', skillsUsed: ['ai-tools', 'sql'] },
    ],
    portfolio: 'pakorn-builds.example',
    assessmentScore: 96,
    appliedJobId: 'job-senior-data-analyst',
    avatarHue: 165,
  },
  {
    id: 'cand-04',
    name: 'จิรายุ บ.',
    nameLatin: 'Jirayu B.',
    education: bi('ปริญญาตรี บริหารธุรกิจ', 'BBA Business Administration'),
    yearsExperience: 1,
    skills: [
      { skillId: 'data-analysis', level: 2.4 },
      { skillId: 'sql', level: 2.2 },
      { skillId: 'ai-tools', level: 1.6 },
      { skillId: 'presentation', level: 2.0 },
    ],
    certifications: [],
    projects: [{ name: 'Sales Report Automation (internship)', skillsUsed: ['presentation'] }],
    assessmentScore: 54,
    appliedJobId: 'job-senior-data-analyst',
    avatarHue: 30,
  },
  {
    id: 'cand-05',
    name: 'ธิดารัตน์ ห.',
    nameLatin: 'Thidarat H.',
    education: bi('ปริญญาตรี นิเทศศาสตร์', 'BA Communication Arts'),
    yearsExperience: 5.5,
    skills: [
      { skillId: 'content-creation', level: 4.4 },
      { skillId: 'copywriting', level: 4.0 },
      { skillId: 'seo', level: 3.0 },
      { skillId: 'leadership', level: 2.8 },
      { skillId: 'graphic-design', level: 3.1 },
    ],
    certifications: ['HubSpot Content Marketing'],
    projects: [
      { name: 'Brand Voice Rebuild', skillsUsed: ['content-creation', 'copywriting'] },
      { name: 'Editorial Calendar Program', skillsUsed: ['content-creation'] },
      { name: 'Community Newsletter', skillsUsed: ['client-handling'] },
    ],
    portfolio: 'thidarat-writes.example',
    assessmentScore: 84,
    appliedJobId: 'job-content-marketing-lead',
    avatarHue: 315,
  },
  {
    id: 'cand-06',
    name: 'สมชาย น.',
    nameLatin: 'Somchai N.',
    education: bi('ปริญญาตรี การตลาด', 'BBA Marketing'),
    yearsExperience: 2,
    skills: [
      { skillId: 'content-creation', level: 2.6 },
      { skillId: 'copywriting', level: 2.2 },
      { skillId: 'seo', level: 1.8 },
      { skillId: 'leadership', level: 1.5 },
    ],
    certifications: [],
    projects: [
      { name: 'Campus Ambassador Program', skillsUsed: ['content-creation'] },
      { name: 'Event Recap Series', skillsUsed: ['presentation'] },
    ],
    assessmentScore: 58,
    appliedJobId: 'job-content-marketing-lead',
    avatarHue: 75,
  },
  {
    id: 'cand-07',
    name: 'ชนากานต์ พ.',
    nameLatin: 'Chanakan P.',
    education: bi('ปริญญาตรี บริหารธุรกิจ', 'BBA Business Administration'),
    yearsExperience: 3,
    skills: [
      { skillId: 'client-handling', level: 3.6 },
      { skillId: 'presentation', level: 2.8 },
      { skillId: 'market-research', level: 2.2 },
      { skillId: 'digital-marketing', level: 2.4 },
    ],
    certifications: ['SPIN Selling Fundamentals'],
    projects: [
      { name: 'SMB Territory Expansion', skillsUsed: ['client-handling'] },
      { name: 'Partner Enablement Kit', skillsUsed: ['content-creation'] },
    ],
    assessmentScore: 76,
    appliedJobId: 'job-sales-executive',
    avatarHue: 15,
  },
  {
    id: 'cand-08',
    name: 'ธีรภัทร อ.',
    nameLatin: 'Teerapat A.',
    education: bi('ปริญญาตรี รัฐศาสตร์', 'BA Political Science'),
    yearsExperience: 2,
    skills: [
      { skillId: 'client-handling', level: 3.0 },
      { skillId: 'presentation', level: 2.6 },
      { skillId: 'market-research', level: 2.6 },
    ],
    certifications: [],
    projects: [
      { name: 'Retail Account Coverage', skillsUsed: ['client-handling'] },
      { name: 'Customer Survey Round', skillsUsed: ['market-research'] },
    ],
    assessmentScore: 70,
    appliedJobId: 'job-sales-executive',
    avatarHue: 130,
  },
]

export function candidatesForJob(jobId: string): Candidate[] {
  return CANDIDATES.filter((c) => c.appliedJobId === jobId)
}
