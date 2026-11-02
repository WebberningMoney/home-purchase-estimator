import { describe, expect, it } from 'vitest'
import { createDefaultScenario, evaluate, findMaxAffordable, isAffordable } from '../src/core'
import { toneOf } from '../src/lib/zones'

const today = new Date('2026-10-30')
const near = (actual: number, expected: number, tolerance = 1) => expect(Math.abs(actual - expected)).toBeLessThan(tolerance)

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

// 下面的數字是另外用獨立程式（只依規格、不看本專案程式碼）重算出來的，用來防止公式悄悄跑掉
describe('對照獨立重算（範例資料、2026-10-30）', () => {
  it('賣屋後的現金與買房後剩餘', () => {
    const result = evaluate(createDefaultScenario(), today)
    near(result.assetsTotal, 12_612_000)
    near(result.usableAssets, 7_800_000)
    near(result.availableCash, 16_100_000)
    near(result.remainingCash, 3_860_000)
    near(result.cashAfterReserve, 3_403_750)
  })

  it('每月房貸與每年還款', () => {
    const result = evaluate(createDefaultScenario(), today)
    near(result.monthlyPayment, 96_872.58, 0.01)
    near(result.annualPayment, 1_485_907.37, 0.01)
  })

  it('最多買得起：3,730 萬，上限那天存款撐 37 個月、再貴 20 萬就掉到 34 個月', () => {
    const scenario = createDefaultScenario()
    expect(findMaxAffordable(scenario, today)).toEqual({ price: 37_300_000, limitedBy: '存款續航' })
    const runwayAt = (price: number) => {
      const draft = structuredClone(scenario)
      draft.buyer.price = price
      return evaluate(draft, today).runway.months
    }
    expect(runwayAt(37_300_000)).toBe(37)
    expect(runwayAt(37_500_000)).toBe(34)
  })

  it('不賣舊屋：可用現金只剩資產，買不起', () => {
    const scenario = createDefaultScenario()
    scenario.seller.enabled = false
    const result = evaluate(scenario, today)
    near(result.availableCash, 7_800_000)
    near(result.cashAfterReserve, -4_896_250)
    expect(isAffordable(result)).toBe(false)
  })
})

describe('一致性：同一套標準', () => {
  it('拉桿綠藍區 ⇔ 房價在「最多買得起」以內', () => {
    const scenario = createDefaultScenario()
    const { price: limit } = findMaxAffordable(scenario, today)
    for (let price = 5_000_000; price <= 100_000_000; price += 700_000) {
      const draft = structuredClone(scenario)
      draft.buyer.price = price
      const result = evaluate(draft, today)
      const greenOrBlue = toneOf(result) === 'good' || toneOf(result) === 'steady'
      expect(greenOrBlue, `房價 ${price}`).toBe(price <= limit)
    }
  })

  it('不同的利率、成數、預備金下，上限都剛好是分界', () => {
    const cases = [
      { rate: 0.01, ltv: 0.5, reserve: 3 },
      { rate: 0.06, ltv: 0.8, reserve: 12 },
      { rate: 0.1, ltv: 0.3, reserve: 6 },
    ]
    for (const c of cases) {
      const scenario = createDefaultScenario()
      scenario.buyer.annualRate = c.rate
      scenario.buyer.ltv = c.ltv
      scenario.household.reserveMonths = c.reserve
      const { price } = findMaxAffordable(scenario, today)
      const at = (value: number) => {
        const draft = structuredClone(scenario)
        draft.buyer.price = value
        return isAffordable(evaluate(draft, today))
      }
      if (price > 0) expect(at(price), JSON.stringify(c)).toBe(true)
      expect(at(price + 200_000), JSON.stringify(c)).toBe(false)
    }
  })
})

describe('賣屋時的貸款', () => {
  it('舊屋房貸一定還清，就算開關沒開', () => {
    const scenario = createDefaultScenario()
    scenario.loans[0].settleOnSale = false
    const result = evaluate(scenario, today)
    expect(result.loans[0].settled).toBe(true)
    near(result.payoffTotal, 7_300_000)
  })

  it('信貸看使用者選擇：不選就留著繼續繳', () => {
    const scenario = createDefaultScenario()
    const result = evaluate(scenario, today)
    expect(result.loans[1].settled).toBe(false)
    scenario.loans[1].settleOnSale = true
    near(evaluate(scenario, today).payoffTotal, 8_300_000)
  })

  it('賣屋實拿現金＝賣價 − 手續費 − 稅費 − 還清的貸款', () => {
    const result = evaluate(createDefaultScenario(), today)
    near(result.saleNetCash, 16_250_000 - 650_000 - 7_300_000)
    near(result.availableCash, result.usableAssets + result.saleNetCash)
  })
})
