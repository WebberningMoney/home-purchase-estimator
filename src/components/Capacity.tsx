import type { Evaluation, MaxAffordable, Scenario } from '../core'
import { fmtBig, fmtMoney, fmtMonths, fmtPercent } from '../lib/format'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  max: MaxAffordable
}

type Mark = 'ok' | 'no' | 'info'

const MARK_TEXT: Record<Mark, string> = { ok: '✓', no: '✗', info: '＋' }

/** 想買的房價不管多少，先告訴你：照現在的條件，最多買到哪裡 */
export function Capacity({ scenario, evaluation: e, max }: Props) {
  const { buyer, household } = scenario
  const unlimited = max.limitedBy === '沒有上限'
  const gap = max.price - buyer.price
  const scaleMax = Math.max(buyer.price, unlimited ? buyer.price : max.price) * 1.12 || 1
  const wantAt = Math.min(100, (buyer.price / scaleMax) * 100)
  const limitAt = Math.min(100, (max.price / scaleMax) * 100)

  const reserveGap = e.cashAfterReserve
  const runwayOk = e.runway.rating === '低風險' || e.runway.rating === '不耗用現金'
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

      <div className="capacity-main">
        <b className="capacity-price">{max.price <= 0 ? '買不起任何房' : unlimited ? '10 億以上' : fmtBig(max.price)}</b>
        {max.price > 0 && !unlimited && (
          <p className={gap >= 0 ? 'pos' : 'neg'}>
            {gap >= 0 ? `你想買的 ${fmtBig(buyer.price)} 在範圍內，還有 ${fmtBig(gap)} 的空間` : `你想買的 ${fmtBig(buyer.price)} 超出 ${fmtBig(-gap)}`}
          </p>
        )}
        {max.limitedBy !== '沒有上限' && <p className="hint">再貴就會先卡在「{max.limitedBy}」</p>}
      </div>

      {max.price > 0 && !unlimited && (
        <div className="gauge" aria-hidden="true">
          <div className="gauge-track">
            <span className="gauge-fill" style={{ width: `${limitAt}%` }} />
            <span className={`gauge-want ${gap >= 0 ? '' : 'over'}`} style={{ left: `${wantAt}%` }} />
          </div>
          <div className="gauge-labels">
            <span>0</span>
            <span>▲ 想買 {fmtBig(buyer.price)}</span>
          </div>
        </div>
      )}

      <ul className="criteria">
        {criteria.map((item) => (
          <li key={item.text} className={item.mark}>
            <span className="mark">{MARK_TEXT[item.mark]}</span>
            <span className="criteria-text">{item.text}</span>
            <span className="criteria-note">{item.note}</span>
          </li>
        ))}
      </ul>
      <p className="hint">上限＝同時守住上面三件事的最高房價。✓ ✗ 是你目前想買的房價的結果。</p>

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
