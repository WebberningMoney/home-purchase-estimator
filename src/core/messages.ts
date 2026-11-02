import type { PriceLimits } from './affordability'
import { riskText } from './risk'
import type { Evaluation, Scenario } from './types'

const wan = (value: number) => Math.round(value / 10000).toLocaleString('en-US')
const yearsText = (months: number) => (months / 12).toFixed(1)

export interface Description {
  /** 一句話結論 */
  headline: string
  /** 補充說明 */
  detail: string
}

/** 把算出來的結果翻成白話。可行、有條件可行、不可行各有一套說法 */
export function describe(evaluation: Evaluation, scenario: Scenario, limits: PriceLimits): Description {
  const { verdict, runway } = evaluation
  const price = scenario.buyer.price

  const headline = riskText(evaluation)

  if (verdict === '可行') {
    return { headline, detail: '買完房現金夠用，每年的還款也在預算內，還存得到想存的金額。' }
  }

  if (verdict === '有條件可行') {
    if (!runway.burnsCash) {
      return { headline, detail: '收入付得起生活費和貸款，不用動到存款，只是每年存不到想存的金額。' }
    }
    const lasts =
      runway.months === null
        ? '之後有貸款還完，缺口會消失，存款撐得過全程。'
        : `存款大約能撐 ${runway.months} 個月（${yearsText(runway.months)} 年）。`
    return { headline, detail: `每年要動用存款，${lasts}` }
  }

  const diff = Math.abs(limits.lowRisk - price)
  const where = limits.lowRisk < price ? '低' : '高'
  return {
    headline,
    detail: `卡在「${limits.limitedBy === '存款續航' ? '存款撐不夠久' : '買房現金'}」。照現在的條件，低風險內最高約 ${wan(limits.lowRisk)} 萬（比預計價${where} ${wan(diff)} 萬）。`,
  }
}
