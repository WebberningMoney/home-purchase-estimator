import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import { NumberField } from './NumberField'
import { OptionalNumberField } from './OptionalNumberField'
import { Row, Section } from './Section'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

/** 賣舊屋：賣價、手續費，以及房地合一稅需要的資料 */
export function SellerPanel({ scenario, evaluation, onChange }: Props) {
  const { seller } = scenario
  const taxMissing = seller.originalPrice === null || seller.holdingYears === null
  return (
    <Section
      title="賣舊屋"
      disabled={!seller.enabled}
      action={
        <Toggle
          checked={seller.enabled}
          onChange={(checked) => onChange((d) => void (d.seller.enabled = checked))}
          label="要賣舊屋"
          text={seller.enabled ? '要賣' : '不賣'}
        />
      }
      summary={
        !seller.enabled
          ? '不賣舊屋，下面的數字都不計算'
          : evaluation.salePrice > 0
          ? `賣價 ${fmtBig(evaluation.salePrice)}，扣掉費用與貸款後約剩 ${fmtBig(
              evaluation.salePrice - evaluation.sellerFee - evaluation.capitalGainsTax - evaluation.payoffTotal,
            )}`
          : '還沒有舊屋要賣'
      }
    >
      <p className="hint block">第一次買房、或舊屋要留著不賣，就把右上角開關關掉。</p>
      <Row label="每坪單價">
        <NumberField
          value={seller.unitPrice}
          onChange={(value) => onChange((d) => void (d.seller.unitPrice = value))}
          min={0}
          suffix="元/坪"
          label="每坪單價"
        />
      </Row>
      <Row label="坪數" hint={`房屋賣價 ${fmtMoney(evaluation.salePrice)} 元`}>
        <NumberField
          value={seller.ping}
          onChange={(value) => onChange((d) => void (d.seller.ping = value))}
          decimals={2}
          min={0}
          suffix="坪"
          label="坪數"
        />
      </Row>
      <Row label="賣方手續費率" hint={`約 ${fmtMoney(evaluation.sellerFee)} 元`}>
        <NumberField
          value={seller.feeRate}
          onChange={(value) => onChange((d) => void (d.seller.feeRate = value))}
          scale={100}
          decimals={2}
          min={0}
          suffix="%"
          label="賣方手續費率"
        />
      </Row>

      <Section title="稅與其他費用" summary={taxMissing ? '房地合一稅還沒算' : `房地合一稅約 ${fmtBig(evaluation.capitalGainsTax)}`}>
        <Row label="原買價" hint="房地合一稅用；空白＝稅額以 0 計">
          <OptionalNumberField
            value={seller.originalPrice}
            onChange={(value) => onChange((d) => void (d.seller.originalPrice = value))}
            suffix="元"
            label="原買價"
          />
        </Row>
        <Row label="持有年數">
          <OptionalNumberField
            value={seller.holdingYears}
            onChange={(value) => onChange((d) => void (d.seller.holdingYears = value))}
            suffix="年"
            label="持有年數"
          />
        </Row>
        <Row label="自住且符合免稅資格" hint="設籍並居住滿 6 年，可先扣 400 萬再課稅（簡化）">
          <Toggle
            checked={seller.ownerOccupiedExempt}
            onChange={(checked) => onChange((d) => void (d.seller.ownerOccupiedExempt = checked))}
            label="自住且符合免稅資格"
            text={seller.ownerOccupiedExempt ? '是' : '否'}
          />
        </Row>
        <Row label="土地增值稅" hint="依公告現值計算，自行填入">
          <NumberField
            value={seller.landValueTax}
            onChange={(value) => onChange((d) => void (d.seller.landValueTax = value))}
            min={0}
            suffix="元"
            label="土地增值稅"
          />
        </Row>
        <Row label="其他賣方費用" hint="代書、規費等">
          <NumberField
            value={seller.otherFees}
            onChange={(value) => onChange((d) => void (d.seller.otherFees = value))}
            min={0}
            suffix="元"
            label="其他賣方費用"
          />
        </Row>
        {taxMissing && evaluation.salePrice > 0 && (
          <p className="hint warn">還沒填原買價或持有年數，房地合一稅先以 0 計，賣房後的現金可能算多了。</p>
        )}
      </Section>
    </Section>
  )
}
