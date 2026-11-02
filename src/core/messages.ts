import type { MaxAffordable } from './affordability'
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
export function describe(evaluation: Evaluation, scenario: Scenario, max: MaxAffordable): Description {
  const { verdict, runway } = evaluation
  const price = scenario.buyer.price

  if (verdict === '可行') {
    return {
      headline: '買得起',
      detail: '買完房現金夠用，每年的還款也在預算內。',
    }
  }

  if (verdict === '有條件可行') {
    let detail: string
    if (!runway.burnsCash) {
      detail = '每年還款超過預算，但收入還是夠付，不用動到存款。'
    } else if (runway.months === null) {
      detail = '每年會動用存款，但之後有貸款還完，缺口會消失，存款撐得過全程。'
    } else {
      detail = `每年會動用存款，大約能撐 ${runway.months} 個月（${yearsText(runway.months)} 年）。`
    }
    return { headline: '勉強買得起，要靠存款補', detail }
  }

  const diff = Math.abs(max.price - price)
  const where = max.price < price ? '低' : '高'
  return {
    headline: '買不起',
    detail: `卡在「${max.limitedBy === '存款續航' ? '存款撐不夠久' : '買房現金'}」。照現在的條件，房價上限約 ${wan(max.price)} 萬（比預計價${where} ${wan(diff)} 萬）。`,
  }
}
