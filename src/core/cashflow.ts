import type { MonthRow, Runway, RiskLevel } from './types'

/** 一年的推演最多看幾個月：40 年 */
export const HORIZON_MONTHS = 480

export interface RetainedLoan {
  monthly: number
  /** 還剩幾個月；null＝一直繳 */
  remainingMonths: number | null
}

export interface SimulationInput {
  startCash: number
  monthlyIncome: number
  monthlyLiving: number
  termMonths: number
  graceMonths: number
  gracePayment: number
  amortizedPayment: number
  retainedLoans: RetainedLoan[]
}

/** 逐月推演：每月收入 − 生活費 − 新房貸 − 保留的貸款，累計現金從 startCash 開始 */
export function simulate(input: SimulationInput): MonthRow[] {
  const rows: MonthRow[] = []
  let cash = input.startCash
  for (let month = 1; month <= HORIZON_MONTHS; month++) {
    const newMortgage =
      month > input.termMonths ? 0 : month <= input.graceMonths ? input.gracePayment : input.amortizedPayment
    let retained = 0
    for (const loan of input.retainedLoans) {
      if (loan.remainingMonths === null || loan.remainingMonths >= month) retained += loan.monthly
    }
    const net = input.monthlyIncome - input.monthlyLiving - newMortgage - retained
    cash += net
    rows.push({
      month,
      income: input.monthlyIncome,
      living: input.monthlyLiving,
      newMortgage,
      retained,
      net,
      cash,
    })
  }
  return rows
}

export function rateRunway(months: number | null, burnsCash: boolean, warn: number, safe: number): RiskLevel {
  if (!burnsCash) return 'none'
  if (months === null || months >= safe) return 'low'
  if (months >= warn) return 'medium'
  return 'high'
}

/** 從逐月推演整理出：現金可撐多久、何時轉正、最低點 */
export function summarizeRunway(
  rows: MonthRow[],
  burnsCash: boolean,
  monthlyOutflow: number,
  usableCash: number,
  warn: number,
  safe: number,
): Runway {
  const firstNegative = rows.find((row) => row.cash < 0)
  const months = burnsCash ? (firstNegative ? firstNegative.month - 1 : null) : null
  const firstPositive = rows.find((row) => row.net >= 0)
  return {
    burnsCash,
    months,
    rating: rateRunway(months, burnsCash, warn, safe),
    firstPositiveMonth: firstPositive ? firstPositive.month : null,
    lowestCash: rows.reduce((lowest, row) => Math.min(lowest, row.cash), Infinity),
    monthsIgnoringPayoff: burnsCash ? usableCash / monthlyOutflow : null,
  }
}
