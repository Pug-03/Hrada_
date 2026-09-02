import type { LearningItem } from './types'

/**
 * §9.8 — twelve learning options. At least three target Leadership and two
 * target AI Tools, because those are the gaps this dataset produces most.
 */
export const LEARNING_CATALOG: LearningItem[] = [
  {
    id: 'ln-01',
    title: 'Leading Without Authority',
    type: 'Course',
    targetSkill: 'leadership',
    difficulty: 1,
    durationHours: 12,
  },
  {
    id: 'ln-02',
    title: 'First-Time Manager Workshop',
    type: 'Workshop',
    targetSkill: 'leadership',
    difficulty: 2,
    durationHours: 16,
  },
  {
    id: 'ln-03',
    title: 'Mentorship with HR Manager',
    type: 'Mentorship',
    targetSkill: 'leadership',
    difficulty: 3,
    durationHours: 24,
  },
  {
    id: 'ln-04',
    title: 'Prompting for Business Teams',
    type: 'Course',
    targetSkill: 'ai-tools',
    difficulty: 1,
    durationHours: 8,
  },
  {
    id: 'ln-05',
    title: 'Applied AI Automation Lab',
    type: 'Workshop',
    targetSkill: 'ai-tools',
    difficulty: 3,
    durationHours: 20,
  },
  {
    id: 'ln-06',
    title: 'Analytics Storytelling',
    type: 'Course',
    targetSkill: 'data-analysis',
    difficulty: 2,
    durationHours: 14,
  },
  {
    id: 'ln-07',
    title: 'SQL Performance Deep Dive',
    type: 'Course',
    targetSkill: 'sql',
    difficulty: 3,
    durationHours: 18,
  },
  {
    id: 'ln-08',
    title: 'Client Conversations That Convert',
    type: 'Course',
    targetSkill: 'client-handling',
    difficulty: 1,
    durationHours: 10,
  },
  {
    id: 'ln-09',
    title: 'Coaching Skills for Team Leads',
    type: 'Workshop',
    targetSkill: 'coaching',
    difficulty: 2,
    durationHours: 16,
  },
  {
    id: 'ln-10',
    title: 'Presenting to Executives',
    type: 'Workshop',
    targetSkill: 'presentation',
    difficulty: 2,
    durationHours: 12,
  },
  {
    id: 'ln-11',
    title: 'Technical SEO Certification',
    type: 'Certification',
    targetSkill: 'seo',
    difficulty: 3,
    durationHours: 30,
  },
  {
    id: 'ln-12',
    title: 'Research Methods Intensive',
    type: 'Course',
    targetSkill: 'ux-research',
    difficulty: 2,
    durationHours: 15,
  },
]
