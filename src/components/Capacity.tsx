import { PRICE_CEILING, RISK_NAME } from '../core'
import type { Evaluation, PriceLimits, RiskLevel, Scenario } from '../core'
import { fmtBig, fmtMoney, fmtMonths, fmtPercent } from '../lib/format'
import type { Tone } from '../lib/zones'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  limits: PriceLimits
}

type Mark = 'ok' | 'no' | 'info'

const MARK_TEXT: Record<Mark, string> = { ok: '✓', no: '✗', info: '＋' }

/** 想買的房價不管多少，先告訴你：照現在的條件，最多買到哪裡 */
export function Capacity({ scenario, evaluation: e, limits }: Props) {
  const { buyer, household } = scenario
  const unlimited = limits.limitedBy === '沒有上限'
  const gap = limits.lowRisk - buyer.price
  const finite = (price: number) => (price >= PRICE_CEILING ? 0 : price)
  const scaleMax = Math.max(buyer.price, finite(limits.mediumRisk), finite(limits.lowRisk)) * 1.12 || 1
  const at = (price: number) => Math.min(100, (price / scaleMax) * 100)
  const savedPerYear = e.annualNetCashflow
  const priceText = (price: number) => (price >= PRICE_CEILING ? '10 億以上' : price <= 0 ? '買不起任何房' : fmtBig(price))
  const boundaries: { tone: Tone; level: RiskLevel; price: number }[] = [
    { tone: 'good', level: 'none', price: limits.noRisk },
    { tone: 'steady', level: 'low', price: limits.lowRisk },
    { tone: 'watch', level: 'medium', price: limits.mediumRisk },
  ]

  const reserveGap = e.cashAfterReserve
  const runwayOk = e.runway.rating === 'none' || e.runway.rating === 'low'
  const runwayText = !e.runway.burnsCash
    ? '每月收入付得起，不用動存款'
    : e.runway.months === null
      ? '存款撐得過全程'
      : `存款約撐 ${fmtMonths(e.runway.months)}`

  const criteria: { mark: Mark; text: string; note: string }[] = [
    {
      mark: reserveGap >= 0 ? 'ok' : 'no',
      text: `買完房，還留得住 ${household.reserveMonths} 個月生活費當緊急預備金`,
      note: reserveGap >= 0 ? `預備金之外還剩 ${fmtBig(reserveGap)}` : `缺 ${fmtBig(-reserveGap)}`,
    },
    {
      mark: 'info',
      text: '每月收入不夠繳時，允許動用剩餘現金去補',
      note: e.runway.burnsCash ? `目前每月補 ${fmtMoney(e.monthlyOutflow)} 元` : '目前不需要補',
    },
    {
      mark: runwayOk ? 'ok' : 'no',
      text: `補貼的現金要撐得過 ${household.safeMonths} 個月（低風險門檻）`,
      note: runwayText,
    },
    {
      mark: e.annualCheck === '通過' ? 'ok' : 'no',
      text: `每年存下 ${fmtBig(household.yearlySavings)} 的預計存款（達到才是無風險）`,
      note:
        savedPerYear >= household.yearlySavings
          ? `每年約存得下 ${fmtBig(savedPerYear)}`
          : savedPerYear >= 0
            ? `每年只存得下 ${fmtBig(savedPerYear)}，差 ${fmtBig(household.yearlySavings - savedPerYear)}`
            : `每年反而要動用存款 ${fmtBig(-savedPerYear)}`,
    },
  ]

  const snapshot = [
    ['總資產', fmtBig(e.assetsTotal)],
    ['現有貸款', fmtBig(e.debtTotal)],
    ['買房可用現金', fmtBig(e.availableCash)],
    ['每月收入', fmtBig(e.annualIncome / 12)],
    ['每月生活費', fmtBig(e.annualLiving / 12)],
    ['緊急預備金', fmtBig(e.reserve)],
  ]

  return (
    <section className="capacity" aria-label="最多買得起">
      <header className="capacity-head">
        <h2>照現在的條件，最多買得起</h2>
        <span className="hint">
          貸款 {fmtPercent(buyer.ltv, 0)}、利率 {fmtPercent(buyer.annualRate, 2)}、{buyer.termYears} 年
        </span>
      </header>

      <div className="capacity-body">
        <div className="capacity-main">
          <b className="capacity-price">{priceText(limits.lowRisk)}</b>
          {limits.lowRisk > 0 && !unlimited && (
            <p className={gap >= 0 ? 'pos' : 'neg'}>
              {gap >= 0
                ? `想買的 ${fmtBig(buyer.price)} 在範圍內，還有 ${fmtBig(gap)} 的空間`
                : `想買的 ${fmtBig(buyer.price)} 超出 ${fmtBig(-gap)}`}
            </p>
          )}
          {!unlimited && <p className="hint">再貴就會先卡在「{limits.limitedBy}」</p>}
          <ul className="boundaries">
            {boundaries.map(({ tone, level, price }) => (
              <li key={level}>
                <i className={`dot ${tone}`} />
                <span>{RISK_NAME[level]}</span>
                <b>{price > 0 ? `最多 ${priceText(price)}` : '照目前條件做不到'}</b>
              </li>
            ))}
            <li>
              <i className="dot bad" />
              <span>再貴就是{RISK_NAME.high}</span>
            </li>
          </ul>
          {limits.lowRisk > 0 && !unlimited && (
            <div className="gauge" aria-hidden="true">
              <div className="gauge-track">
                <span className="gauge-zone watch" style={{ width: `${at(limits.mediumRisk)}%` }} />
                <span className="gauge-zone steady" style={{ width: `${at(limits.lowRisk)}%` }} />
                <span className="gauge-zone good" style={{ width: `${at(limits.noRisk)}%` }} />
                <span className={`gauge-want ${gap >= 0 ? '' : 'over'}`} style={{ left: `${at(buyer.price)}%` }} />
              </div>
              <div className="gauge-labels">
                <span>▲ 想買 {fmtBig(buyer.price)}</span>
              </div>
            </div>
          )}
        </div>

        <ul className="criteria">
          {criteria.map((item) => (
            <li key={item.text} className={item.mark}>
              <span className="mark">{MARK_TEXT[item.mark]}</span>
              <span className="criteria-text">{item.text}</span>
              <span className="criteria-note">{item.note}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="hint">大數字是低風險以內的最高房價；綠色是連存款目標都達成的最高房價，黃色是撐得過警戒月數的最高房價。✓ ✗ 是你目前想買的房價的結果。</p>

      <dl className="snapshot">
        {snapshot.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
