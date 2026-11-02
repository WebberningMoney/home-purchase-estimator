import { evaluate } from './feasibility'
import { isWithinRisk } from './risk'
import type { Evaluation, RiskLevel, Scenario } from './types'

/** 房價往上找的天花板，再貴的房子這個工具也不適合拿來評估 */
export const PRICE_CEILING = 1_000_000_000
/** 結果取到 10 萬，畫面上才不會出現零碎數字 */
const PRICE_STEP = 100_000

export type PriceLimit = '買房現金' | '存款續航' | '沒有上限'

/** 三條界線：房價越高風險越大，每一條是該風險等級內的最高房價；連 0 元都過不了時是 0 */
export interface PriceLimits {
  /** 不耗用現金，也存得到預計存款（無風險） */
  noRisk: number
  /** 風險最多到低風險；也是「最多買得起」 */
  lowRisk: number
  /** 風險最多到中風險；再貴就是高風險 */
  mediumRisk: number
  /** 超過 lowRisk 後，是哪個條件先破功 */
  limitedBy: PriceLimit
}

function evaluateAt(scenario: Scenario, price: number, today: Date): Evaluation {
  const draft = structuredClone(scenario)
  draft.buyer.price = price
  return evaluate(draft, today)
}

/** 房價越高越難，所以用二分法找出風險不超過 worst 的最高房價。0 元都過不了回傳 0 */
function highestPrice(scenario: Scenario, today: Date, worst: RiskLevel): number {
  const passes = (price: number) => isWithinRisk(evaluateAt(scenario, price, today), worst)
  if (!passes(0)) return 0
  if (passes(PRICE_CEILING)) return PRICE_CEILING

  let low = 0
  let high = PRICE_CEILING
  while (high - low > PRICE_STEP) {
    const middle = Math.floor((low + high) / 2 / PRICE_STEP) * PRICE_STEP
    if (passes(middle)) low = middle
    else high = middle
  }
  return low
}

export function findPriceLimits(scenario: Scenario, today: Date = new Date()): PriceLimits {
  const noRisk = highestPrice(scenario, today, 'none')
  const lowRisk = highestPrice(scenario, today, 'low')
  const mediumRisk = highestPrice(scenario, today, 'medium')
  if (lowRisk === PRICE_CEILING) return { noRisk, lowRisk, mediumRisk, limitedBy: '沒有上限' }

  const blocked = evaluateAt(scenario, lowRisk + PRICE_STEP, today)
  return { noRisk, lowRisk, mediumRisk, limitedBy: blocked.cashCheck === '不足' ? '買房現金' : '存款續航' }
}
