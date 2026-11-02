import { RISK_NAME } from '../core'
import type { Evaluation, IncomeSource, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import { NumberField } from './NumberField'
import { Row, Section } from './Section'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

let counter = 0
const newSource = (number: number): IncomeSource => ({
  id: `income-${Date.now()}-${counter++}`,
  name: `收入來源 ${number}`,
  annual: 0,
  interrupt: false,
})

/** 家庭收支：收入、生活費、想存多少，以及風險門檻 */
export function HouseholdPanel({ scenario, evaluation, onChange }: Props) {
  const { household } = scenario
  return (
    <Section
      title="家庭收支"
      summary={`年收入 ${fmtBig(evaluation.annualIncome)}，每年可拿來還房貸 ${fmtBig(evaluation.annualBudget)}`}
    >
      <p className="hint block">收入請填稅後金額。「可能中斷」打開，代表收入失去時要做壓力測試。</p>
      {household.sources.map((source, index) => (
        <div className="income-row" key={source.id}>
          <input
            className="text-input"
            aria-label={`收入來源 ${index + 1} 名稱`}
            value={source.name}
            onChange={(event) => onChange((d) => void (d.household.sources[index].name = event.target.value))}
          />
          <NumberField
            value={source.annual}
            onChange={(value) => onChange((d) => void (d.household.sources[index].annual = value))}
            min={0}
            suffix="元/年"
            label={`${source.name}年收入`}
          />
          <Toggle
            checked={source.interrupt}
            onChange={(checked) => onChange((d) => void (d.household.sources[index].interrupt = checked))}
            label={`${source.name}可能中斷`}
            text="可能中斷"
          />
          <button
            type="button"
            className="icon-button"
            aria-label={`刪除${source.name}`}
            disabled={household.sources.length <= 1}
            onClick={() => onChange((d) => void d.household.sources.splice(index, 1))}
          >
            刪除
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button"
        onClick={() => onChange((d) => void d.household.sources.push(newSource(d.household.sources.length + 1)))}
      >
        新增收入來源
      </button>

      <Row label="每天生活費" hint={`一年約 ${fmtMoney(evaluation.annualLiving)} 元`}>
        <NumberField
          value={household.dailyExpense}
          onChange={(value) => onChange((d) => void (d.household.dailyExpense = value))}
          min={0}
          suffix="元/天"
          label="每天生活費"
        />
      </Row>
      <Row label="每年想存多少" hint="會先扣掉，剩下才算能拿來還貸款">
        <NumberField
          value={household.yearlySavings}
          onChange={(value) => onChange((d) => void (d.household.yearlySavings = value))}
          min={0}
          suffix="元/年"
          label="每年想存多少"
        />
      </Row>
      <p className="hint block">
        每年能拿來還貸款的上限（年預算）＝年收入 − 生活費 − 想存的錢＝ <b>{fmtMoney(evaluation.annualBudget)} 元</b>。每年還款超過它，就達不到存款目標，要動用存款補。
      </p>

      <Section title="風險門檻" summary={`預備金 ${household.reserveMonths} 個月，存款撐 ${household.warnMonths}～${household.safeMonths} 個月`}>
        <Row label="緊急預備金" hint="買完房後，至少留幾個月的生活費不動">
          <NumberField
            value={household.reserveMonths}
            onChange={(value) => onChange((d) => void (d.household.reserveMonths = value))}
            min={0}
            suffix="個月"
            label="緊急預備金月數"
          />
        </Row>
        <Row label={RISK_NAME.none} hint="收入付得起生活費、貸款和想存的錢，不必動用現金（自動判斷）">
          <span className="hint">不用設定</span>
        </Row>
        <Row label={RISK_NAME.low} hint="要動用現金，但現金能撐到這麼久以上">
          <NumberField
            value={household.safeMonths}
            onChange={(value) =>
              onChange((d) => {
                d.household.safeMonths = value
                d.household.warnMonths = Math.min(d.household.warnMonths, value)
              })
            }
            min={0}
            suffix="個月以上"
            label="低風險門檻月數"
          />
        </Row>
        <Row label={RISK_NAME.medium} hint="要動用現金，現金能撐到這麼久以上、但不到低風險門檻">
          <NumberField
            value={household.warnMonths}
            onChange={(value) => onChange((d) => void (d.household.warnMonths = Math.min(value, d.household.safeMonths)))}
            min={0}
            suffix="個月以上"
            label="中風險門檻月數"
          />
        </Row>
        <Row label={RISK_NAME.high} hint="現金撐不到中風險門檻，也會被判買不起">
          <span className="hint">少於 {household.warnMonths} 個月</span>
        </Row>
        <p className="hint block">標「可能中斷」的收入消失時，也用同一套門檻評風險：買完房的現金能撐幾個月，落在哪一級。</p>
      </Section>
    </Section>
  )
}
