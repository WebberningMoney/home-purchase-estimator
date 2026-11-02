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

/** 月繳金：有手動填就用手動的，否則用原始本金、年期、利率自動算 */
export function loanMonthly(loan: Loan): number {
  if (loan.monthlyOverride !== null) return loan.monthlyOverride
  if (loan.originalPrincipal <= 0 || loan.termYears <= 0) return 0
  return pmt(loan.annualRate, loan.termYears * 12, loan.originalPrincipal)
}

/** 剩下幾個月繳完。有起始日就用日期算；沒有就用剩餘本金與月繳金推 */
export function loanRemainingMonths(loan: Loan, monthly: number, today: Date): number | null {
  const start = loan.startDate ? parseDate(loan.startDate) : null
  if (start && loan.termYears > 0) {
    return Math.max(0, loan.termYears * 12 - monthsBetween(start, today))
  }
  if (monthly <= 0 || loan.remainingPrincipal <= 0) return null
  const i = loan.annualRate / 12
  if (i === 0) return loan.remainingPrincipal / monthly
  const ratio = 1 - (loan.remainingPrincipal * i) / monthly
  // 月繳金連利息都付不完，永遠還不清
  if (ratio <= 0) return null
  return -Math.log(ratio) / Math.log(1 + i)
}

/** 依起始日推算現在還剩多少本金 */
export function estimatePrincipal(loan: Loan, monthly: number, today: Date): number | null {
  const start = loan.startDate ? parseDate(loan.startDate) : null
  if (!start || loan.originalPrincipal <= 0) return null
  const elapsed = monthsBetween(start, today)
  const i = loan.annualRate / 12
  if (i === 0) return loan.originalPrincipal - monthly * elapsed
  const growth = Math.pow(1 + i, elapsed)
  return loan.originalPrincipal * growth - (monthly * (growth - 1)) / i
}

/** settled＝這筆貸款會在賣屋時一次還清（由呼叫端依貸款類型與是否賣屋決定） */
export function evaluateLoan(loan: Loan, today: Date, settled: boolean): LoanResult {
  const monthly = loanMonthly(loan)
  const estimated = estimatePrincipal(loan, monthly, today)
  const tolerance = Math.max(10000, loan.remainingPrincipal * 0.02)
  const penalty = settled ? loan.remainingPrincipal * loan.penaltyRate : 0

  let note = ''
  if (loan.remainingPrincipal > 0 && (loan.originalPrincipal <= 0 || !loan.startDate || loan.termYears <= 0)) {
    note = '補上原始本金、起始日、年期、利率，月繳金就能自動算'
  } else if (estimated !== null && Math.abs(estimated - loan.remainingPrincipal) > tolerance) {
    note = `依起始日推算剩餘本金約 ${Math.round(estimated).toLocaleString('en-US')}，與填寫差很多，請核對`
  }

  return {
    id: loan.id,
    monthly,
    remainingMonths: loanRemainingMonths(loan, monthly, today),
    settled,
    payoffCash: settled ? loan.remainingPrincipal + penalty : 0,
    penalty,
    estimatedPrincipal: estimated,
    note,
  }
}
