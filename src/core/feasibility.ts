import { assetValue, usableValue } from './assets'
import { HORIZON_MONTHS, simulate, summarizeRunway } from './cashflow'
import { evaluateLoan, pmt } from './loan'
import { capitalGainsTax, salePrice } from './tax'
import type { AnnualCheck, Evaluation, MaxPrice, Scenario, StressTest, Verdict } from './types'

/** 每月繳 payment、共 months 個月，現在值多少（貸得到的金額） */
function presentValue(annualRate: number, months: number, payment: number): number {
  const i = annualRate / 12
  if (i === 0) return payment * months
  return (payment * (1 - Math.pow(1 + i, -months))) / i
}

/** 用目前填的全部條件，算出可不可行、現金能撐多久、最高能買多貴 */
export function evaluate(scenario: Scenario, today: Date = new Date()): Evaluation {
  const { household, assets, rates, loans, seller, buyer } = scenario

  // 資產
  const assetsTotal = assets.reduce((sum, a) => sum + assetValue(a, rates), 0)
  const usableAssets = assets.reduce((sum, a) => sum + usableValue(a, rates), 0)

  // 貸款
  const loanResults = loans.map((loan) => evaluateLoan(loan, today))
  // 不賣舊屋時，所有貸款都留著繼續繳
  const selling = seller.enabled
  const payoffTotal = selling ? loanResults.reduce((sum, r) => sum + r.payoffCash, 0) : 0
  const keptLoans = loans
    .map((loan, index) => ({ loan, result: loanResults[index] }))
    .filter(({ loan }) => !selling || !loan.settleOnSale)
  const retainedMonthly = keptLoans.reduce((sum, { result }) => sum + result.monthly, 0)
  const retainedPrincipal = keptLoans.reduce((sum, { loan }) => sum + loan.remainingPrincipal, 0)
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.remainingPrincipal, 0)
  const hasRetained = retainedPrincipal > 0

  // 賣舊屋
  const salePriceValue = selling ? salePrice(seller) : 0
  const sellerFee = salePriceValue * seller.feeRate
  const tax = selling ? capitalGainsTax(seller) : 0
  const sellerCosts = selling ? seller.landValueTax + seller.otherFees : 0

  // 買新屋
  const loanAmount = buyer.price * buyer.ltv
  const graceMonthly = buyer.graceYears > 0 ? (loanAmount * buyer.annualRate) / 12 : 0
  const amortMonths = Math.max(0, (buyer.termYears - buyer.graceYears) * 12)
  const monthlyPayment = pmt(buyer.annualRate, amortMonths, loanAmount)
  const downPayment = buyer.price * (1 - buyer.ltv)
  const buyerFee = buyer.price * buyer.feeRate
  const cashNeeded = downPayment + buyerFee + buyer.renovation + buyer.otherCosts

  // 現金
  const availableCash =
    usableAssets + salePriceValue - sellerFee - tax - sellerCosts - payoffTotal
  const remainingCash = availableCash - cashNeeded
  const reserve = ((household.dailyExpense * 365) / 12) * household.reserveMonths
  const cashAfterReserve = remainingCash - reserve

  // 年收支
  const annualIncome = household.sources.reduce((sum, s) => sum + s.annual, 0)
  const annualLiving = household.dailyExpense * 365
  const annualBudget = annualIncome - annualLiving - household.yearlySavings
  const annualPayment = (Math.max(graceMonthly, monthlyPayment) + (hasRetained ? retainedMonthly : 0)) * 12
  const budgetSlack = annualBudget - annualPayment
  const annualNetCashflow = annualIncome - annualLiving - annualPayment
  const monthlyOutflow = Math.max(0, -annualNetCashflow / 12)
  const burnsCash = monthlyOutflow > 0

  // 現金續航
  const usableCash = Math.max(0, cashAfterReserve)
  const schedule = simulate({
    startCash: usableCash,
    monthlyIncome: annualIncome / 12,
    monthlyLiving: annualLiving / 12,
    termMonths: buyer.termYears * 12,
    graceMonths: buyer.graceYears * 12,
    gracePayment: graceMonthly,
    amortizedPayment: monthlyPayment,
    retainedLoans: keptLoans.map(({ result }) => ({
      monthly: result.monthly,
      remainingMonths: result.remainingMonths,
    })),
  })
  const runway = summarizeRunway(
    schedule,
    burnsCash,
    monthlyOutflow,
    usableCash,
    household.warnMonths,
    household.safeMonths,
  )

  // 三種結論
  const cashCheck = cashAfterReserve >= 0 ? '通過' : '不足'
  let annualCheck: AnnualCheck
  if (annualPayment <= annualBudget) annualCheck = '通過'
  else if (!burnsCash) annualCheck = '儲蓄不足'
  else if (runway.months === null || runway.months >= household.warnMonths) annualCheck = '耗用現金'
  else annualCheck = '超出預算'

  let verdict: Verdict = '不可行'
  if (cashCheck === '通過' && annualCheck === '通過') verdict = '可行'
  else if (cashCheck === '通過' && (annualCheck === '儲蓄不足' || annualCheck === '耗用現金')) verdict = '有條件可行'

  // 收入中斷壓力測試
  const interrupted = household.sources.filter((s) => s.interrupt).reduce((sum, s) => sum + s.annual, 0)
  const stressIncome = (annualIncome - interrupted) / 12
  const stressExpense = annualLiving / 12 + annualPayment / 12
  const stressGap = Math.max(0, stressExpense - stressIncome)
  const stress: StressTest = {
    monthlyIncome: stressIncome,
    monthlyExpense: stressExpense,
    monthlyGap: stressGap,
    months: stressGap === 0 ? null : remainingCash / stressGap,
    passed: stressGap === 0 || remainingCash / stressGap >= household.interruptMonths,
  }

  // 最高可買房價
  const budgetForNewLoan = annualBudget - (hasRetained ? retainedMonthly * 12 : 0)
  const maxLoan = Math.max(0, presentValue(buyer.annualRate, buyer.termYears * 12, budgetForNewLoan / 12))
  const byCashflow = buyer.ltv > 0 ? maxLoan / buyer.ltv : Infinity
  const priceLoad = 1 - buyer.ltv + buyer.feeRate
  const fixedCosts = buyer.renovation + buyer.otherCosts + reserve
  const byCash = (availableCash - fixedCosts) / priceLoad
  const safe = household.safeMonths
  const byRunway = Math.max(
    0,
    Math.min(
      byCash,
      (availableCash - fixedCosts + safe * (annualIncome / 12 - annualLiving / 12 - retainedMonthly)) /
        (priceLoad + safe * buyer.ltv * pmt(buyer.annualRate, buyer.termYears * 12, 1)),
    ),
  )
  const withinBudget = Math.min(byCashflow, byCash)
  let blocker: string
  if (verdict === '可行') blocker = '無'
  else if (verdict === '有條件可行') blocker = '年預算（需動用現金補）'
  else if (cashCheck !== '通過') blocker = '自備現金'
  else blocker = `現金續航（撐不到 ${household.warnMonths} 個月）`
  const maxPrice: MaxPrice = {
    budgetForNewLoan,
    byCashflow,
    byCash,
    byRunway,
    withinBudget,
    gapToPrice: withinBudget - buyer.price,
    blocker,
  }

  return {
    assetsTotal,
    usableAssets,
    unusedAssets: assetsTotal - usableAssets,
    salePrice: salePriceValue,
    sellerFee,
    capitalGainsTax: tax,
    loans: loanResults,
    payoffTotal,
    retainedMonthly,
    retainedPrincipal,
    debtTotal: totalPrincipal,
    loanAmount,
    graceMonthly,
    monthlyPayment,
    downPayment,
    buyerFee,
    cashNeeded,
    availableCash,
    remainingCash,
    reserve,
    cashAfterReserve,
    annualIncome,
    annualLiving,
    annualBudget,
    annualPayment,
    budgetSlack,
    annualNetCashflow,
    monthlyOutflow,
    cashCheck,
    annualCheck,
    verdict,
    runway,
    stress,
    netWorthBefore: assetsTotal + salePriceValue - totalPrincipal,
    netWorthAfter: buyer.price + remainingCash + (assetsTotal - usableAssets) - loanAmount - retainedPrincipal,
    maxPrice,
    schedule,
  }
}

export { HORIZON_MONTHS }
