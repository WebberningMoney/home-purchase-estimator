import { describe, expect, it } from 'vitest'
import { evaluateLoan, monthsBetween, pmt } from '../src/core/loan'
import { capitalGainsTax } from '../src/core/tax'
import type { Loan, Seller } from '../src/core/types'

const baseLoan: Loan = {
  id: 'l1',
  name: '信貸',
  kind: 'personal',
  originalPrincipal: 3_000_000,
  startDate: '2026-05-08',
  termYears: 10,
  annualRate: 0.03,
  remainingPrincipal: 2_892_349,
  monthlyOverride: null,
  settleOnSale: false,
  penaltyRate: 0,
}

describe('月繳金', () => {
  it('100 萬、2.6%、30 年約每月 4,003', () => {
    expect(Math.round(pmt(0.026, 360, 1_000_000))).toBe(4003)
  })

  it('利率 0 就是平均分攤', () => {
    expect(pmt(0, 120, 1_200_000)).toBe(10_000)
  })

  it('跟試算表的信貸 2 一致：300 萬、3%、10 年 ＝ 28,968', () => {
    expect(Math.round(evaluateLoan(baseLoan, new Date(2026, 9, 30)).monthly)).toBe(28_968)
  })

  it('手動填的月繳金會蓋過自動計算', () => {
    const result = evaluateLoan({ ...baseLoan, monthlyOverride: 30_000 }, new Date(2026, 9, 30))
    expect(result.monthly).toBe(30_000)
  })
})

describe('剩餘月數', () => {
  it('滿幾個月才算，不滿一個月不算', () => {
    expect(monthsBetween(new Date(2026, 4, 8), new Date(2026, 9, 30))).toBe(5)
    expect(monthsBetween(new Date(2026, 4, 8), new Date(2026, 10, 7))).toBe(5)
    expect(monthsBetween(new Date(2026, 4, 8), new Date(2026, 10, 8))).toBe(6)
  })

  it('10 年期的信貸 2 還剩 115 個月（跟試算表一致）', () => {
    expect(evaluateLoan(baseLoan, new Date(2026, 9, 30)).remainingMonths).toBe(115)
  })

  it('沒有起始日就用剩餘本金與月繳金推算', () => {
    const result = evaluateLoan({ ...baseLoan, startDate: null, monthlyOverride: 28_968 }, new Date(2026, 9, 30))
    expect(result.remainingMonths).toBeGreaterThan(110)
    expect(result.remainingMonths).toBeLessThan(120)
  })

  it('月繳金連利息都付不完，視為一直繳', () => {
    const result = evaluateLoan(
      { ...baseLoan, startDate: null, monthlyOverride: 1_000, remainingPrincipal: 5_000_000 },
      new Date(2026, 9, 30),
    )
    expect(result.remainingMonths).toBeNull()
  })
})

describe('賣房後結清', () => {
  it('結清要出本金加違約金', () => {
    const result = evaluateLoan(
      { ...baseLoan, settleOnSale: true, penaltyRate: 0.01 },
      new Date(2026, 9, 30),
    )
    expect(result.payoffCash).toBeCloseTo(2_892_349 * 1.01, 2)
  })

  it('不結清就不用出現金', () => {
    expect(evaluateLoan(baseLoan, new Date(2026, 9, 30)).payoffCash).toBe(0)
  })
})

describe('房地合一稅', () => {
  const seller: Seller = {
    enabled: true,
    unitPrice: 500_000,
    ping: 20,
    feeRate: 0.04,
    originalPrice: 6_000_000,
    holdingYears: 3,
    ownerOccupiedExempt: false,
    landValueTax: 0,
    otherFees: 0,
  }

  it('沒填原買價就算 0', () => {
    expect(capitalGainsTax({ ...seller, originalPrice: null })).toBe(0)
  })

  it('持有 3 年適用 35%', () => {
    // 賣價 1,000 萬 − 手續費 40 萬 − 原買價 600 萬 = 360 萬
    expect(capitalGainsTax(seller)).toBeCloseTo(3_600_000 * 0.35, 2)
  })

  it('自住滿 6 年先扣 400 萬再課 10%', () => {
    const result = capitalGainsTax({ ...seller, ownerOccupiedExempt: true, holdingYears: 7, originalPrice: 2_000_000 })
    // 賣價 1,000 萬 − 手續費 40 萬 − 原買價 200 萬 = 760 萬，扣 400 萬 = 360 萬
    expect(result).toBeCloseTo(360_000, 2)
  })

  it('賣虧了不用繳稅', () => {
    expect(capitalGainsTax({ ...seller, originalPrice: 20_000_000 })).toBe(0)
  })
})
