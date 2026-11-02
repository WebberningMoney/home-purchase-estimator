import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import { NumberField } from './NumberField'
import { Row, Section } from './Section'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

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
        </div>
      ))}

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

      <Section title="風險門檻" summary={`預備金 ${household.reserveMonths} 個月，存款撐 ${household.warnMonths / 12}～${household.safeMonths / 12} 年`}>
        <Row label="緊急預備金" hint="買完房後，至少留幾個月的生活費不動">
          <NumberField
            value={household.reserveMonths}
            onChange={(value) => onChange((d) => void (d.household.reserveMonths = value))}
            min={0}
            suffix="個月"
            label="緊急預備金月數"
          />
        </Row>
        <Row label="收入中斷多久" hint="壓力測試用：標「可能中斷」的收入消失幾個月">
          <NumberField
            value={household.interruptMonths}
            onChange={(value) => onChange((d) => void (d.household.interruptMonths = value))}
            min={0}
            suffix="個月"
            label="預計收入中斷月數"
          />
        </Row>
        <Row label="高風險門檻" hint="存款撐不到這麼久，就是高風險，也會被判不可行">
          <NumberField
            value={household.warnMonths}
            onChange={(value) => onChange((d) => void (d.household.warnMonths = value))}
            min={0}
            suffix="個月"
            label="現金續航警戒月數"
          />
        </Row>
        <Row label="低風險門檻" hint="存款撐超過這麼久，缺口很慢，收入成長或賣資產就能補">
          <NumberField
            value={household.safeMonths}
            onChange={(value) => onChange((d) => void (d.household.safeMonths = value))}
            min={0}
            suffix="個月"
            label="現金續航安全月數"
          />
        </Row>
      </Section>
    </Section>
  )
}
