import type { Scenario } from './types'

/**
 * 示意用的家庭資料，不是任何人的真實數字。
 * 情境：兩人年收入 120 萬、手上 500 萬資產、有一筆信貸，想買一間 2,000 萬的新屋（沒有舊屋要賣）。
 */
export function createDefaultScenario(): Scenario {
  return {
    household: {
      sources: [
        { id: 'income-1', name: '收入來源 1', annual: 700_000, interrupt: false },
        { id: 'income-2', name: '收入來源 2', annual: 500_000, interrupt: true },
      ],
      dailyExpense: 1_200,
      yearlySavings: 200_000,
      reserveMonths: 6,
      interruptMonths: 12,
      warnMonths: 18,
      safeMonths: 36,
    },
    // 合計 500 萬：美股 2 萬美元、BTC 0.1 顆（匯率見 rates）
    assets: [
      { key: 'twStock', amount: 900_000, use: true, ratio: 1 },
      { key: 'twEtf', amount: 800_000, use: true, ratio: 1 },
      { key: 'usStock', amount: 20_000, use: true, ratio: 1 },
      { key: 'fund', amount: 400_000, use: true, ratio: 1 },
      { key: 'policy', amount: 0, use: false, ratio: 1 },
      { key: 'btc', amount: 0.1, use: false, ratio: 1 },
      { key: 'cash', amount: 2_004_000, use: true, ratio: 1 },
    ],
    rates: { usdTwd: 32, btcUsd: 80_000 },
    loans: [
      {
        id: 'loan-1',
        name: '信貸',
        kind: 'personal',
        originalPrincipal: 1_000_000,
        startDate: null,
        termYears: 7,
        annualRate: 0.03,
        rateChanges: [],
        remainingPrincipal: 1_000_000,
        monthlyOverride: null,
        settleOnSale: false,
        penaltyRate: 0,
      },
    ],
    seller: {
      enabled: false,
      unitPrice: 0,
      ping: 0,
      feeRate: 0.04,
      originalPrice: null,
      holdingYears: null,
      ownerOccupiedExempt: false,
      landValueTax: 0,
      otherFees: 0,
    },
    buyer: {
      price: 20_000_000,
      ltv: 0.8,
      annualRate: 0.025,
      termYears: 30,
      graceYears: 0,
      feeRate: 0.02,
      renovation: 0,
      otherCosts: 0,
    },
  }
}
