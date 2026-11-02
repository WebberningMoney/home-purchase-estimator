import { evaluate, riskLevel } from '../core'
import type { Evaluation, RiskLevel, Scenario } from '../core'

/** 拉桿底色：綠＝無風險、藍＝低風險、黃＝中風險、紅＝高風險 */
export type Tone = 'good' | 'steady' | 'watch' | 'bad'

const TONE_OF_RISK: Record<RiskLevel, Tone> = { none: 'good', low: 'steady', medium: 'watch', high: 'bad' }

export function toneOf(evaluation: Evaluation): Tone {
  return TONE_OF_RISK[riskLevel(evaluation)]
}

/**
 * 把拉桿從最小拉到最大，每一點都重算一次，記下當下是哪種狀態。
 * apply 負責把這個值套進一份複製的資料。
 */
export function sampleTones(
  scenario: Scenario,
  apply: (draft: Scenario, value: number) => void,
  min: number,
  max: number,
  today: Date,
  count = 100,
): Tone[] {
  const tones: Tone[] = []
  for (let i = 0; i < count; i++) {
    const draft = structuredClone(scenario)
    apply(draft, min + ((max - min) * i) / (count - 1))
    tones.push(toneOf(evaluate(draft, today)))
  }
  return tones
}

/** 連續相同的狀態合併，轉成 CSS 漸層（硬邊，不做模糊過渡） */
export function zonesGradient(tones: Tone[]): string {
  if (tones.length === 0) return 'transparent'
  const stops: string[] = []
  let start = 0
  for (let i = 1; i <= tones.length; i++) {
    if (i === tones.length || tones[i] !== tones[start]) {
      const from = (start / tones.length) * 100
      const to = (i / tones.length) * 100
      stops.push(`var(--tone-${tones[start]}) ${from}%`, `var(--tone-${tones[start]}) ${to}%`)
      start = i
    }
  }
  return `linear-gradient(to right, ${stops.join(', ')})`
}
