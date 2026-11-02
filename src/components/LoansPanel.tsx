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

/** 今天的日期，格式 YYYY-MM-DD，當成新利率調整的預設起始日 */
const todayText = (): string => new Date().toISOString().slice(0, 10)

let counter = 0
const newLoan = (): Loan => ({
  id: `loan-${Date.now()}-${counter++}`,
  name: '新貸款',
  kind: 'personal',
  originalPrincipal: 0,
  startDate: null,
  termYears: 5,
  annualRate: 0.03,
  rateChanges: [],
  remainingPrincipal: null,
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
      summary={`剩 ${fmtBig(evaluation.debtTotal)}${scenario.seller.enabled ? `，賣房後要還 ${fmtBig(evaluation.payoffTotal)}` : ''}`}
    >
      <p className="hint block">
        填原始本金、起始日、年期、利率，剩餘本金、月繳金和剩餘月數都會自動算。利率有調整過，就在下面記一筆。欄位留白＝自動算，想用銀行給的實際數字，直接填進去。
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
                <span>起始利率（年）</span>
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
                <span>目前剩餘本金（空白＝自動算）</span>
                <OptionalNumberField
                  value={loan.remainingPrincipal}
                  onChange={(value) => onChange((d) => void (d.loans[index].remainingPrincipal = value))}
                  placeholder={fmtMoney(result.autoPrincipal ?? 0)}
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

            <div className="rate-changes">
              <span className="rate-changes-title">利率調整紀錄（目前利率 {(result.currentRate * 100).toFixed(2)}%）</span>
              {loan.rateChanges.map((change, changeIndex) => (
                <div className="rate-change-row" key={`${change.from}-${changeIndex}`}>
                  <input
                    type="date"
                    className="text-input"
                    aria-label="從哪天起"
                    value={change.from}
                    onChange={(event) =>
                      onChange((d) => void (d.loans[index].rateChanges[changeIndex].from = event.target.value))
                    }
                  />
                  <span className="hint">起改為</span>
                  <NumberField
                    value={change.annualRate}
                    onChange={(value) => onChange((d) => void (d.loans[index].rateChanges[changeIndex].annualRate = value))}
                    scale={100}
                    decimals={2}
                    min={0}
                    suffix="%"
                    label="調整後利率"
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="刪除這筆利率調整"
                    onClick={() => onChange((d) => void d.loans[index].rateChanges.splice(changeIndex, 1))}
                  >
                    刪除
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button"
                onClick={() =>
                  onChange((d) => void d.loans[index].rateChanges.push({ from: todayText(), annualRate: loan.annualRate }))
                }
              >
                新增利率調整
              </button>
            </div>

            <footer className="loan-foot">
              <div className="loan-settle">
                {loan.kind === 'mortgage' ? (
                  <span className="hint">
                    {scenario.seller.enabled ? '舊屋房貸：賣屋時一定要全部還清' : '不賣舊屋，這筆房貸繼續繳'}
                  </span>
                ) : (
                  <Toggle
                    checked={loan.settleOnSale}
                    onChange={(checked) => onChange((d) => void (d.loans[index].settleOnSale = checked))}
                    label={`${loan.name}賣房後結清`}
                    text="賣房後一次還清"
                  />
                )}
                {result.settled && (
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
                {result.settled ? `，賣房時需拿出 ${fmtBig(result.payoffCash)}` : '，賣房後繼續繳'}
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
