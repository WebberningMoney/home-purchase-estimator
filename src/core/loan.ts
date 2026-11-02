import type { Loan, LoanResult } from './types'

/** 等額本息每月要繳多少。利率為 0 時就是平均分攤 */
export function pmt(annualRate: number, months: number, principal: number): number {
  if (months <= 0 || principal <= 0) return 0
  const i = annualRate / 12
  if (i === 0) return principal / months
  return (principal * i) / (1 - Math.pow(1 + i, -months))
}

/** 兩個日期之間「滿幾個月」，跟試算表的 DATEDIF(…,"M") 一樣 */
export function monthsBetween(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (end.getDate() < start.getDate()) months -= 1
  return Math.max(0, months)
}

function parseDate(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** 往後推 months 個月，日數超過當月天數時取月底（1/31 往後一個月是 2/28） */
function addMonths(start: Date, months: number): Date {
  const first = new Date(start.getFullYear(), start.getMonth() + months, 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return new Date(first.getFullYear(), first.getMonth(), Math.min(start.getDate(), lastDay))
}

/** 某一天適用的利率：取已經生效的最後一次調整，沒有調整過就是起始利率 */
export function rateOn(loan: Loan, date: Date): number {
  let rate = loan.annualRate
  let latest = -Infinity
  for (const change of loan.rateChanges) {
    const from = parseDate(change.from)
    if (from && from <= date && from.getTime() >= latest) {
      rate = change.annualRate
      latest = from.getTime()
    }
  }
  return rate
}

/**
 * 依起始日一期一期往下推，算出現在還剩多少本金。
 * 每一期用當時的利率；利率有調整時，銀行會用剩下的本金與期數重算月繳金，這裡照做。
 */
export function amortizedBalance(loan: Loan, today: Date): number | null {
  const start = loan.startDate ? parseDate(loan.startDate) : null
  if (!start || loan.originalPrincipal <= 0 || loan.termYears <= 0) return null
  const totalMonths = loan.termYears * 12
  const paid = Math.min(monthsBetween(start, today), totalMonths)
  let balance = loan.originalPrincipal
  for (let period = 1; period <= paid; period++) {
    const rate = rateOn(loan, addMonths(start, period - 1))
    const payment = pmt(rate, totalMonths - (period - 1), balance)
    balance = balance * (1 + rate / 12) - payment
  }
  return Math.max(0, balance)
}

/** 還要繳幾個月。月繳金連利息都付不完時還不完，回傳 null */
function monthsToPayOff(principal: number, monthly: number, annualRate: number): number | null {
  if (monthly <= 0 || principal <= 0) return null
  const i = annualRate / 12
  if (i === 0) return principal / monthly
  const ratio = 1 - (principal * i) / monthly
  if (ratio <= 0) return null
  return -Math.log(ratio) / Math.log(1 + i)
}

/** settled＝這筆貸款會在賣屋時一次還清（由呼叫端依貸款類型與是否賣屋決定） */
export function evaluateLoan(loan: Loan, today: Date, settled: boolean): LoanResult {
  const start = loan.startDate ? parseDate(loan.startDate) : null
  const autoPrincipal = amortizedBalance(loan, today)
  const principal = loan.remainingPrincipal ?? autoPrincipal ?? 0
  const currentRate = rateOn(loan, today)

  // 有起始日與年期：剩餘期數直接數，月繳金用「目前利率、剩餘本金、剩餘期數」重算。
  // 沒有的話：月繳金用原始條件算，剩餘期數再從剩餘本金推。
  let monthly: number
  let remainingMonths: number | null
  if (start && loan.termYears > 0) {
    remainingMonths = Math.max(0, loan.termYears * 12 - monthsBetween(start, today))
    monthly = loan.monthlyOverride ?? pmt(currentRate, remainingMonths, principal)
  } else {
    monthly =
      loan.monthlyOverride ??
      (loan.originalPrincipal > 0 && loan.termYears > 0 ? pmt(loan.annualRate, loan.termYears * 12, loan.originalPrincipal) : 0)
    remainingMonths = monthsToPayOff(principal, monthly, currentRate)
  }

  const penalty = settled ? principal * loan.penaltyRate : 0
  const tolerance = Math.max(10000, principal * 0.02)

  let note = ''
  if (autoPrincipal === null && loan.remainingPrincipal === null) {
    note = '補上原始本金、起始日、年期，剩餘本金就能自動算'
  } else if (loan.remainingPrincipal !== null && autoPrincipal !== null && Math.abs(autoPrincipal - loan.remainingPrincipal) > tolerance) {
    note = `依起始日與利率推算，剩餘本金約 ${Math.round(autoPrincipal).toLocaleString('en-US')}，與填寫差很多；清空欄位就會改用自動計算`
  }

  return {
    id: loan.id,
    monthly,
    remainingMonths,
    settled,
    payoffCash: settled ? principal + penalty : 0,
    penalty,
    principal,
    autoPrincipal,
    currentRate,
    note,
  }
}
