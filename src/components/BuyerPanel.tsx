import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import type { Tone } from '../lib/zones'
import { NumberField } from './NumberField'
import { Row, Section } from './Section'
import { SliderField } from './SliderField'
import { ToneLegend } from './ToneLegend'

export const PRICE_RANGE = { min: 5_000_000, max: 100_000_000, step: 100_000 }
export const RATE_RANGE = { min: 0.01, max: 0.1, step: 0.0005 }
export const LTV_RANGE = { min: 0, max: 1, step: 0.01 }

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  priceTones: Tone[]
  rateTones: Tone[]
  ltvTones: Tone[]
  onChange: (change: (draft: Scenario) => void) => void
}

/** 買新房：最常調的三根拉桿放最上面 */
export function BuyerPanel({ scenario, evaluation, priceTones, rateTones, ltvTones, onChange }: Props) {
  const { buyer } = scenario
  return (
    <section className="panel buyer-panel" aria-label="買新房">
      <h2>想買的新房</h2>
      <p className="panel-lead">拉動下面的拉桿，右邊的結果會馬上變。拉桿的底色就是答案：哪一段買得起，哪一段買不起。</p>
      <ToneLegend />

      <SliderField
        label="房價"
        value={buyer.price}
        onChange={(value) => onChange((d) => void (d.buyer.price = value))}
        {...PRICE_RANGE}
        suffix="元"
        minLabel="500 萬"
        maxLabel="1 億"
        tones={priceTones}
        hint={`約 ${fmtBig(buyer.price)}`}
      />
      <SliderField
        label="貸款利率（年）"
        value={buyer.annualRate}
        onChange={(value) => onChange((d) => void (d.buyer.annualRate = value))}
        {...RATE_RANGE}
        scale={100}
        decimals={2}
        suffix="%"
        minLabel="1%"
        maxLabel="10%"
        tones={rateTones}
        hint="可以參考各銀行目前的房貸利率"
      />
      <SliderField
        label="貸款成數"
        value={buyer.ltv}
        onChange={(value) => onChange((d) => void (d.buyer.ltv = value))}
        {...LTV_RANGE}
        scale={100}
        decimals={0}
        suffix="%"
        minLabel="0%（全部自己出）"
        maxLabel="100%"
        tones={ltvTones}
        hint={`貸 ${fmtBig(evaluation.loanAmount)}、自備 ${fmtBig(evaluation.downPayment)}，每月繳 ${fmtMoney(
          Math.max(evaluation.graceMonthly, evaluation.monthlyPayment),
        )} 元`}
      />

      <Section title="更多條件" summary={`${buyer.termYears} 年期，裝潢 ${fmtBig(buyer.renovation)}`}>
        <Row label="貸款年期" hint="貸款要繳幾年">
          <NumberField
            value={buyer.termYears}
            onChange={(value) => onChange((d) => void (d.buyer.termYears = value))}
            min={1}
            max={50}
            suffix="年"
            label="貸款年期"
          />
        </Row>
        <Row label="寬限期" hint="只繳利息的年數，0 就是沒有">
          <NumberField
            value={buyer.graceYears}
            onChange={(value) => onChange((d) => void (d.buyer.graceYears = value))}
            min={0}
            max={buyer.termYears}
            suffix="年"
            label="寬限期"
          />
        </Row>
        <Row label="裝潢費">
          <NumberField
            value={buyer.renovation}
            onChange={(value) => onChange((d) => void (d.buyer.renovation = value))}
            min={0}
            suffix="元"
            label="裝潢費"
          />
        </Row>
        <Row label="買方手續費率" hint="仲介、代書、契稅、印花稅、貸款開辦費合計">
          <NumberField
            value={buyer.feeRate}
            onChange={(value) => onChange((d) => void (d.buyer.feeRate = value))}
            scale={100}
            decimals={2}
            min={0}
            suffix="%"
            label="買方手續費率"
          />
        </Row>
        <Row label="其他一次性費用" hint="搬家、家具家電等">
          <NumberField
            value={buyer.otherCosts}
            onChange={(value) => onChange((d) => void (d.buyer.otherCosts = value))}
            min={0}
            suffix="元"
            label="其他一次性費用"
          />
        </Row>
      </Section>
    </section>
  )
}
