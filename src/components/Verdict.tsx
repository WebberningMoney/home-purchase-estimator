import { RISK_NAME, describe, riskLevel } from '../core'
import type { Evaluation, PriceLimits, Scenario } from '../core'
import { fmtBig, fmtPercent } from '../lib/format'
import { toneOf } from '../lib/zones'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  limits: PriceLimits
}

/** 右邊最上面的大結論：一眼看出買不買得起 */
export function Verdict({ scenario, evaluation, limits }: Props) {
  const tone = toneOf(evaluation)
  const text = describe(evaluation, scenario, limits)
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
        <li className={`risk-${riskLevel(evaluation)}`}>
          <span>風險等級</span>
          <b>{RISK_NAME[riskLevel(evaluation)]}</b>
        </li>
      </ul>
    </section>
  )
}
