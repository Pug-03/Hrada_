import { describe, expect, it } from 'vitest'

import { JOBS } from './jobs'
import { pickResumeSample, RESUME_SAMPLES } from './resumeSamples'
import { getSkill } from './skills'

const JOB_IDS = new Set(JOBS.map((j) => j.id))

describe('resume samples', () => {
  it('targets a real job', () => {
    for (const sample of RESUME_SAMPLES) {
      expect(JOB_IDS.has(sample.targetJobId), sample.nameLatin).toBe(true)
    }
  })

  it('gives every job at least two samples, so a repeat draw does not repeat', () => {
    for (const jobId of JOB_IDS) {
      const forJob = RESUME_SAMPLES.filter((s) => s.targetJobId === jobId)
      expect(forJob.length, jobId).toBeGreaterThanOrEqual(2)
    }
  })

  it('carries a real skillId and a bilingual extraction excerpt on every skill', () => {
    for (const sample of RESUME_SAMPLES) {
      expect(sample.skills.length, sample.nameLatin).toBeGreaterThanOrEqual(3)
      for (const s of sample.skills) {
        expect(() => getSkill(s.skillId), `${sample.nameLatin} — ${s.skillId}`).not.toThrow()
        expect(s.level, `${sample.nameLatin} — ${s.skillId}`).toBeGreaterThan(0)
        expect(s.extractedFrom?.th, `${sample.nameLatin} — ${s.skillId}`).toBeTruthy()
        expect(s.extractedFrom?.en, `${sample.nameLatin} — ${s.skillId}`).toBeTruthy()
      }
    }
  })

  it('meets every required skill for the job it targets, so the demo never lands on a critical gap', () => {
    for (const sample of RESUME_SAMPLES) {
      const job = JOBS.find((j) => j.id === sample.targetJobId)!
      for (const req of job.requiredSkills) {
        const level = sample.skills.find((s) => s.skillId === req.skillId)?.level ?? 0
        expect(level, `${sample.nameLatin} — ${req.skillId}`).toBeGreaterThanOrEqual(req.level)
      }
    }
  })
})

describe('pickResumeSample', () => {
  it('only ever returns a sample matching the requested job', () => {
    for (const jobId of JOB_IDS) {
      for (let draw = 0; draw < 5; draw++) {
        expect(pickResumeSample(jobId, draw).targetJobId).toBe(jobId)
      }
    }
  })

  it('cycles rather than repeating the same sample back to back', () => {
    const jobId = [...JOB_IDS][0]
    const first = pickResumeSample(jobId, 0)
    const second = pickResumeSample(jobId, 1)
    expect(second.nameLatin).not.toBe(first.nameLatin)
  })
})
