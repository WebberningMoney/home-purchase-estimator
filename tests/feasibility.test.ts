import { describe, expect, it } from 'vitest'
import { createDefaultScenario, evaluate } from '../src/core'

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
