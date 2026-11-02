import type { Scenario } from './types'

/** 示意用的家庭資料，不是任何人的真實數字。使用者改成自己的即可 */
export function createDefaultScenario(): Scenario {
  return {
    household: {
      sources: [
        { id: 'income-1', name: '收入來源 1', annual: 1_200_000, interrupt: false },
        { id: 'income-2', name: '收入來源 2', annual: 800_000, interrupt: true },
        { id: 'income-3', name: '收入來源 3', annual: 0, interrupt: false },
      ],
      dailyExpense: 2_500,
      yearlySavings: 300_000,
      reserveMonths: 6,
      interruptMonths: 12,
      warnMonths: 18,
      safeMonths: 36,
    },
    assets: [
      { key: 'twStock', amount: 3_000_000, use: true, ratio: 1 },
      { key: 'twEtf', amount: 2_000_000, use: false, ratio: 1 },
      { key: 'usStock', amount: 50_000, use: true, ratio: 0.5 },
      { key: 'fund', amount: 1_500_000, use: false, ratio: 1 },
      { key: 'policy', amount: 0, use: false, ratio: 1 },
      { key: 'btc', amount: 0.2, use: false, ratio: 1 },
      { key: 'cash', amount: 4_000_000, use: true, ratio: 1 },
    ],
    rates: { usdTwd: 32, btcUsd: 80_000 },
    loans: [
      {
        id: 'loan-1',
        name: '房貸（現居住房屋）',
        kind: 'mortgage',
        originalPrincipal: 8_000_000,
        startDate: '2022-03-01',
        termYears: 30,
        annualRate: 0.021,
        remainingPrincipal: 7_300_000,
        monthlyOverride: null,
        settleOnSale: true,
        penaltyRate: 0,
      },
      {
        id: 'loan-2',
        name: '信貸',
        kind: 'personal',
        originalPrincipal: 1_500_000,
        startDate: '2024-06-01',
        termYears: 5,
        annualRate: 0.03,
        remainingPrincipal: 1_000_000,
        monthlyOverride: null,
        settleOnSale: false,
        penaltyRate: 0,
      },
    ],
    seller: {
      enabled: true,
      unitPrice: 650_000,
      ping: 25,
      feeRate: 0.04,
      originalPrice: null,
      holdingYears: null,
      ownerOccupiedExempt: false,
      landValueTax: 0,
      otherFees: 0,
    },
    buyer: {
      price: 32_000_000,
      ltv: 0.7,
      annualRate: 0.032,
      termYears: 30,
      graceYears: 0,
      feeRate: 0.02,
      renovation: 2_000_000,
      otherCosts: 0,
    },
  }
}
