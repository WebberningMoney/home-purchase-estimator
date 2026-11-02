import { TONE_LABEL } from '../lib/zones'
import type { Tone } from '../lib/zones'

const ORDER: Tone[] = ['good', 'steady', 'watch', 'bad']

/** 拉桿底色的圖例 */
export function ToneLegend() {
  return (
    <p className="tone-legend">
      {ORDER.map((tone) => (
        <span key={tone}>
          <i className={`dot ${tone}`} />
          {TONE_LABEL[tone]}
        </span>
      ))}
    </p>
  )
}
