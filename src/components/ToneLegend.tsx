import { RISK_NAME } from '../core'
import type { RiskLevel } from '../core'
import type { Tone } from '../lib/zones'

const LEGEND: { tone: Tone; level: RiskLevel }[] = [
  { tone: 'good', level: 'none' },
  { tone: 'steady', level: 'low' },
  { tone: 'watch', level: 'medium' },
  { tone: 'bad', level: 'high' },
]

/** 拉桿底色的圖例。藍色也包含「不用動到存款，但存不到預計存款」 */
export function ToneLegend() {
  return (
    <p className="tone-legend">
      {LEGEND.map(({ tone, level }) => (
        <span key={tone}>
          <i className={`dot ${tone}`} />
          {RISK_NAME[level]}
        </span>
      ))}
    </p>
  )
}
