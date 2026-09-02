import { SKILL_BANDS } from '@/data/skills'

/** §7 — the level scale, reachable on demand from the Employee Skill Profile. */
export function SkillLevelLegend() {
  return (
    <table className="w-full text-left text-[13px]">
      <thead>
        <tr className="text-[11px] text-haze">
          <th className="pb-2 font-normal">Level</th>
          <th className="pb-2 font-normal">ชื่อระดับ</th>
          <th className="pb-2 font-normal">หมายถึง</th>
        </tr>
      </thead>
      <tbody>
        {SKILL_BANDS.map((band) => (
          <tr key={band.name} className="border-t border-line/70 align-top">
            <td className="py-2 pr-3 whitespace-nowrap">
              <span className="num text-sky">
                {band.min.toFixed(1)}–{band.max.toFixed(1)}
              </span>
            </td>
            <td className="py-2 pr-3 whitespace-nowrap">{band.name}</td>
            <td className="py-2 leading-relaxed text-haze">{band.meaning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
