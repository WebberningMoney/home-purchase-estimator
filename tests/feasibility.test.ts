import { describe, expect, it } from 'vitest'
import { createDefaultScenario, evaluate, findMaxAffordable, isAffordable } from '../src/core'

const today = new Date('2026-10-30')

describe('範例資料的結論', () => {
  it('範例房價買得起，但要靠存款補', () => {
    const result = evaluate(createDefaultScenario(), today)
    expect(result.verdict).not.toBe('不可行')
  })

  it('房價拉到 9,000 萬就買不起', () => {
    const scenario = createDefaultScenario()
    scenario.buyer.price = 90_000_000
    const result = evaluate(scenario, today)
    expect(result.cashCheck).toBe('不足')
    expect(result.verdict).toBe('不可行')
  })

  it('利率越高，每月房貸越多', () => {
    const low = createDefaultScenario()
    const high = createDefaultScenario()
    high.buyer.annualRate = 0.08
    expect(evaluate(high, today).monthlyPayment).toBeGreaterThan(evaluate(low, today).monthlyPayment)
  })
})

describe('最多買得起的房價', () => {
  it('上限以內買得起，超過一點就不行', () => {
    const scenario = createDefaultScenario()
    const { price } = findMaxAffordable(scenario, today)
    const at = (value: number) => {
      const draft = structuredClone(scenario)
      draft.buyer.price = value
      return isAffordable(evaluate(draft, today))
    }
    expect(price).toBeGreaterThan(0)
    expect(at(price)).toBe(true)
    expect(at(price + 200_000)).toBe(false)
  })

  it('不賣舊屋時，賣屋收入不計、貸款全部留著', () => {
    const selling = createDefaultScenario()
    const keeping = createDefaultScenario()
    keeping.seller.enabled = false
    const a = evaluate(selling, today)
    const b = evaluate(keeping, today)
    expect(b.salePrice).toBe(0)
    expect(b.payoffTotal).toBe(0)
    expect(b.availableCash).toBeLessThan(a.availableCash)
    expect(b.retainedMonthly).toBeGreaterThan(a.retainedMonthly)
  })
})
