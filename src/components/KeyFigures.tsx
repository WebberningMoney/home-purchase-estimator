import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney, fmtMonths } from '../lib/format'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
}

interface Figure {
  label: string
  value: string
  note: string
  bad?: boolean
}

export function KeyFigures({ scenario, evaluation: e }: Props) {
  const { household } = scenario
  const first = e.schedule[0]

  const runwayValue = !e.runway.burnsCash
    ? '不用動存款'
    : e.runway.months === null
      ? '撐過全程'
      : fmtMonths(e.runway.months)

  const figures: Figure[] = [
    {
      label: '買完房剩下的現金',
      value: fmtBig(e.cashAfterReserve),
      note: `已先留 ${household.reserveMonths} 個月生活費（${fmtBig(e.reserve)}）當預備金`,
      bad: e.cashAfterReserve < 0,
    },
    {
      label: '每年要還的貸款',
      value: fmtBig(e.annualPayment),
      note: `新房貸加保留的貸款；每年最多能拿 ${fmtBig(e.annualBudget)} 來還，${e.budgetSlack >= 0 ? '還有餘裕' : '超出'} ${fmtBig(Math.abs(e.budgetSlack))}`,
      bad: e.budgetSlack < 0,
    },
    {
      label: '每年實際存得下',
      value: `${e.annualNetCashflow < 0 ? '−' : ''}${fmtBig(Math.abs(e.annualNetCashflow))}`,
      note:
        e.annualNetCashflow >= household.yearlySavings
          ? `達到每年想存的 ${fmtBig(household.yearlySavings)}`
          : `目標 ${fmtBig(household.yearlySavings)}，還差 ${fmtBig(household.yearlySavings - e.annualNetCashflow)}`,
      bad: e.annualNetCashflow < household.yearlySavings,
    },
    {
      label: '存款能撐多久',
      value: runwayValue,
      note: e.runway.burnsCash
        ? `每月多花 ${fmtMoney(e.monthlyOutflow)} 元；${household.warnMonths} 個月內算高風險，${household.safeMonths} 個月以上算低風險`
        : '每年收入付得起生活費與房貸',
      bad: e.runway.rating === '高風險',
    },
    {
      label: `收入中斷 ${household.interruptMonths} 個月`,
      value: e.stress.months === null ? '不受影響' : `${e.stress.passed ? '通過' : '不通過'}`,
      note:
        e.stress.months === null
          ? '就算標記的收入消失，剩下的收入還是夠'
          : `每月缺 ${fmtMoney(e.stress.monthlyGap)} 元，買完房的現金約撐 ${Math.max(0, e.stress.months).toFixed(1)} 個月`,
      bad: !e.stress.passed,
    },
  ]

  return (
    <section className="figures" aria-label="重點數字">
      <dl className="figure-grid">
        {figures.map((figure) => (
          <div className={`figure ${figure.bad ? 'bad' : ''}`} key={figure.label}>
            <dt>{figure.label}</dt>
            <dd>{figure.value}</dd>
            <p>{figure.note}</p>
          </div>
        ))}
      </dl>
      <p className="flow-line">
        每月：收入 {fmtMoney(first.income)} − 生活費 {fmtMoney(first.living)} − 新房貸 {fmtMoney(first.newMortgage)} − 保留貸款{' '}
        {fmtMoney(first.retained)} ＝ <b className={first.net < 0 ? 'neg' : 'pos'}>{first.net >= 0 ? '+' : '−'}{fmtMoney(Math.abs(first.net))}</b>
      </p>
      <p className="flow-line">
        淨資產：換屋前 {fmtBig(e.netWorthBefore)}，換屋後約 {fmtBig(e.netWorthAfter)}（差額是手續費、裝潢等一次性花費）
      </p>
    </section>
  )
}
