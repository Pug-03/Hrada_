import { FileUp } from 'lucide-react'
import { useRef, useState } from 'react'

import { AnalysisLoader } from '@/components/ui/AnalysisLoader'
import { Button } from '@/components/ui/Button'
import { pickResumeSample } from '@/data/resumeSamples'
import type { Candidate } from '@/data/types'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/cn'

let nextResumeCandidateId = 1

/**
 * A simulated resume drop-zone (§ no real backend or LLM in this prototype).
 * No file is ever read — a drop, a browsed file, and the sample button all
 * funnel into the same simulated analysis, which always resolves to one of
 * resumeSamples.ts's fixed outcomes for whichever job is selected right now.
 *
 * `draw` is owned by the caller (Recruit.tsx) and incremented on every use,
 * so two resumes dropped in a row for the same job draw different samples
 * rather than showing the identical result twice.
 */
export function ResumeDropZone({
  jobId,
  draw,
  onResult,
}: {
  jobId: string
  draw: number
  onResult: (candidate: Candidate) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const { running, run } = useAnalysis(950)

  const analyse = () => {
    if (running) return
    run(() => {
      const sample = pickResumeSample(jobId, draw)
      const candidate: Candidate = {
        ...sample,
        id: `cand-resume-${nextResumeCandidateId++}`,
        appliedJobId: jobId,
      }
      onResult(candidate)
    })
  }

  return (
    <div>
      {running ? (
        <AnalysisLoader message={t('recruit.dropzone.analysing')} rows={1} />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            analyse()
          }}
          aria-label={t('recruit.dropzone.label')}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors duration-150',
            dragOver ? 'border-sky bg-sky/5' : 'border-line hover:border-haze',
          )}
        >
          <FileUp size={20} className="mx-auto text-haze" aria-hidden />
          <p className="mt-2 text-small">{t('recruit.dropzone.label')}</p>
          <p className="mt-0.5 text-micro text-haze">{t('recruit.dropzone.accept')}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) analyse()
              e.target.value = ''
            }}
          />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" onClick={analyse} disabled={running}>
          {t('recruit.dropzone.sample')}
        </Button>
        <p className="text-micro leading-relaxed text-haze">{t('recruit.dropzone.disclaimer')}</p>
      </div>
    </div>
  )
}
