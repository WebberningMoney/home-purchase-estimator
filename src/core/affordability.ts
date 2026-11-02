import { evaluate } from './feasibility'
import type { Evaluation, Scenario } from './types'

/** 房價往上找的天花板，再貴的房子這個工具也不適合拿來評估 */
const PRICE_CEILING = 1_000_000_000
/** 結果取到 10 萬，畫面上才不會出現零碎數字 */
const PRICE_STEP = 100_000

export type PriceLimit = '買房現金' | '存款續航' | '沒有上限'

export interface MaxAffordable {
  /** 守得住三個條件的最高房價；連 0 元都過不了時是 0 */
  price: number
  /** 再貴一點，是哪個條件先破功 */
  limitedBy: PriceLimit
  /** 再多守住「每年存下目標金額」時的最高房價；做不到時是 0 */
  savingsGoalPrice: number
}

/**
 * 「買得起」的標準（貸款成數、利率維持你目前的設定）：
 * 1. 買完房後，還留得住緊急預備金
 * 2. 每月不夠的部分，允許動用剩餘現金去補
 * 3. 但現金要能撐過「低風險」門檻的月數
 */
export function isAffordable(evaluation: Evaluation): boolean {
  const { rating } = evaluation.runway
  return evaluation.cashCheck === '通過' && (rating === '低風險' || rating === '不耗用現金')
}

function evaluateAt(scenario: Scenario, price: number, today: Date): Evaluation {
  const draft = structuredClone(scenario)
  draft.buyer.price = price
  return evaluate(draft, today)
}

/** 買完房後，每年還存得下「想存的金額」，而且現金夠（不必動用存款） */
export function meetsSavingsGoal(evaluation: Evaluation): boolean {
  return evaluation.cashCheck === '通過' && evaluation.annualCheck === '通過'
}

type Passes = (evaluation: Evaluation) => boolean

/** 房價越高越難，所以用二分法找出「還過得了關」的最高房價。0 元都過不了回傳 null */
function highestPassingPrice(scenario: Scenario, today: Date, passes: Passes): number | null {
  if (!passes(evaluateAt(scenario, 0, today))) return null
  if (passes(evaluateAt(scenario, PRICE_CEILING, today))) return PRICE_CEILING

  let low = 0
  let high = PRICE_CEILING
  while (high - low > PRICE_STEP) {
    const middle = Math.floor((low + high) / 2 / PRICE_STEP) * PRICE_STEP
    if (passes(evaluateAt(scenario, middle, today))) low = middle
    else high = middle
  }
  return low
}

export function findMaxAffordable(scenario: Scenario, today: Date = new Date()): MaxAffordable {
  const savingsGoalPrice = highestPassingPrice(scenario, today, meetsSavingsGoal) ?? 0
  const price = highestPassingPrice(scenario, today, isAffordable)
  if (price === null) return { price: 0, limitedBy: '買房現金', savingsGoalPrice }
  if (price === PRICE_CEILING) return { price, limitedBy: '沒有上限', savingsGoalPrice }

  const blocked = evaluateAt(scenario, price + PRICE_STEP, today)
  return { price, limitedBy: blocked.cashCheck === '不足' ? '買房現金' : '存款續航', savingsGoalPrice }
}
