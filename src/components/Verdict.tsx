import { describe } from '../core'
import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtPercent } from '../lib/format'
import { TONE_LABEL, toneOf } from '../lib/zones'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
}

/** 右邊最上面的大結論：一眼看出買不買得起 */
export function Verdict({ scenario, evaluation }: Props) {
  const tone = toneOf(evaluation)
  const text = describe(evaluation, scenario)
  const { buyer } = scenario

  return (
    <section className={`verdict tone-${tone}`} aria-live="polite">
      <p className="verdict-knobs">
        房價 <b>{fmtBig(buyer.price)}</b>，貸款成數 <b>{fmtPercent(buyer.ltv, 0)}</b>，利率 <b>{fmtPercent(buyer.annualRate, 2)}</b>
      </p>
      <h1 className="verdict-headline">{text.headline}</h1>
      <p className="verdict-detail">{text.detail}</p>
      <ul className="verdict-checks">
        <li className={evaluation.cashCheck === '通過' ? 'ok' : 'no'}>
          <span>買房現金</span>
          <b>{evaluation.cashCheck === '通過' ? '夠' : '不夠'}</b>
        </li>
        <li className={evaluation.annualCheck === '通過' ? 'ok' : evaluation.annualCheck === '超出預算' ? 'no' : 'mid'}>
          <span>每年還款</span>
          <b>{evaluation.annualCheck === '通過' ? '在預算內' : evaluation.annualCheck}</b>
        </li>
        <li className={evaluation.runway.rating === '高風險' ? 'no' : evaluation.runway.rating === '需留意' ? 'mid' : 'ok'}>
          <span>存款續航</span>
          <b>{evaluation.runway.rating}</b>
        </li>
      </ul>
      <p className="verdict-legend">
        拉桿底色：<i className="dot good" />
        {TONE_LABEL.good}
        <i className="dot steady" />
        {TONE_LABEL.steady}
        <i className="dot watch" />
        {TONE_LABEL.watch}
        <i className="dot bad" />
        {TONE_LABEL.bad}
      </p>
    </section>
  )
}
