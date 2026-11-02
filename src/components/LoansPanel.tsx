import type { Evaluation, Loan, Scenario } from '../core'
import { LOAN_KIND_LABEL } from '../lib/labels'
import { fmtBig, fmtMoney } from '../lib/format'
import { NumberField } from './NumberField'
import { OptionalNumberField } from './OptionalNumberField'
import { Section } from './Section'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

let counter = 0
const newLoan = (): Loan => ({
  id: `loan-${Date.now()}-${counter++}`,
  name: '新貸款',
  kind: 'personal',
  originalPrincipal: 0,
  startDate: null,
  termYears: 5,
  annualRate: 0.03,
  remainingPrincipal: 0,
  monthlyOverride: null,
  settleOnSale: false,
  penaltyRate: 0,
})

/** 現有貸款：填原始本金、起始日、年期、利率，月繳金會自動算 */
export function LoansPanel({ scenario, evaluation, onChange }: Props) {
  const { loans } = scenario
  return (
    <Section
      title="現有貸款"
      summary={`剩 ${fmtBig(loans.reduce((s, l) => s + l.remainingPrincipal, 0))}，賣房後要還 ${fmtBig(evaluation.payoffTotal)}`}
    >
      <p className="hint block">
        填原始本金、起始日、年期、利率，月繳金和剩餘月數會自動算。已知月繳金也可以直接填，會蓋過自動計算。
      </p>
      {loans.map((loan, index) => {
        const result = evaluation.loans[index]
        return (
          <article className="loan-card" key={loan.id}>
            <header className="loan-head">
              <input
                className="text-input loan-name"
                aria-label="貸款名稱"
                value={loan.name}
                onChange={(event) => onChange((d) => void (d.loans[index].name = event.target.value))}
              />
              <select
                className="select"
                aria-label="貸款類型"
                value={loan.kind}
                onChange={(event) => onChange((d) => void (d.loans[index].kind = event.target.value as Loan['kind']))}
              >
                {(Object.keys(LOAN_KIND_LABEL) as Loan['kind'][]).map((kind) => (
                  <option key={kind} value={kind}>
                    {LOAN_KIND_LABEL[kind]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label={`刪除${loan.name}`}
                onClick={() => onChange((d) => void d.loans.splice(index, 1))}
              >
                刪除
              </button>
            </header>

            <div className="loan-grid">
              <label>
                <span>原始本金</span>
                <NumberField
                  value={loan.originalPrincipal}
                  onChange={(value) => onChange((d) => void (d.loans[index].originalPrincipal = value))}
                  min={0}
                  suffix="元"
                  label="原始本金"
                />
              </label>
              <label>
                <span>起始日</span>
                <input
                  type="date"
                  className="text-input"
                  value={loan.startDate ?? ''}
                  onChange={(event) => onChange((d) => void (d.loans[index].startDate = event.target.value || null))}
                />
              </label>
              <label>
                <span>年期</span>
                <NumberField
                  value={loan.termYears}
                  onChange={(value) => onChange((d) => void (d.loans[index].termYears = value))}
                  min={0}
                  suffix="年"
                  label="年期"
                />
              </label>
              <label>
                <span>利率（年）</span>
                <NumberField
                  value={loan.annualRate}
                  onChange={(value) => onChange((d) => void (d.loans[index].annualRate = value))}
                  scale={100}
                  decimals={2}
                  min={0}
                  suffix="%"
                  label="利率"
                />
              </label>
              <label>
                <span>目前剩餘本金</span>
                <NumberField
                  value={loan.remainingPrincipal}
                  onChange={(value) => onChange((d) => void (d.loans[index].remainingPrincipal = value))}
                  min={0}
                  suffix="元"
                  label="剩餘本金"
                />
              </label>
              <label>
                <span>月繳金（空白＝自動算）</span>
                <OptionalNumberField
                  value={loan.monthlyOverride}
                  onChange={(value) => onChange((d) => void (d.loans[index].monthlyOverride = value))}
                  placeholder={fmtMoney(result.monthly)}
                  suffix="元"
                  label="月繳金"
                />
              </label>
            </div>

            <footer className="loan-foot">
              <div className="loan-settle">
                <Toggle
                  checked={loan.settleOnSale}
                  onChange={(checked) => onChange((d) => void (d.loans[index].settleOnSale = checked))}
                  label={`${loan.name}賣房後結清`}
                  text="賣房後一次還清"
                />
                {loan.settleOnSale && (
                  <label className="inline">
                    <span>違約金率</span>
                    <NumberField
                      value={loan.penaltyRate}
                      onChange={(value) => onChange((d) => void (d.loans[index].penaltyRate = value))}
                      scale={100}
                      decimals={2}
                      min={0}
                      suffix="%"
                      label="違約金率"
                    />
                  </label>
                )}
              </div>
              <p className="loan-facts">
                每月繳 {fmtMoney(result.monthly)} 元
                {result.remainingMonths !== null && `，還要繳 ${Math.round(result.remainingMonths)} 個月`}
                {loan.settleOnSale
                  ? `，賣房時需拿出 ${fmtBig(result.payoffCash)}`
                  : '，賣房後繼續繳'}
              </p>
              {result.note && <p className="hint warn">{result.note}</p>}
            </footer>
          </article>
        )
      })}
      <button type="button" className="button" onClick={() => onChange((d) => void d.loans.push(newLoan()))}>
        新增一筆貸款
      </button>
    </Section>
  )
}
