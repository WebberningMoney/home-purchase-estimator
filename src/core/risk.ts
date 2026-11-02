import type { Evaluation, RiskLevel } from './types'

/** 由輕到重 */
export const RISK_LEVELS: readonly RiskLevel[] = ['none', 'low', 'medium', 'high']

/**
 * 這個房價整體算哪一級風險。
 * 買房現金不足一律是高風險；現金夠的話，不耗用現金但存不到目標算低風險，
 * 其餘看存款能撐多久。
 */
export function riskLevel(evaluation: Evaluation): RiskLevel {
  if (evaluation.verdict === '可行') return 'none'
  if (evaluation.verdict === '不可行') return 'high'
  return evaluation.runway.rating === 'none' ? 'low' : evaluation.runway.rating
}

/** 風險有沒有控制在 worst 以內（含） */
export function isWithinRisk(evaluation: Evaluation, worst: RiskLevel): boolean {
  return RISK_LEVELS.indexOf(riskLevel(evaluation)) <= RISK_LEVELS.indexOf(worst)
}

/** 全程統一用這四個名稱稱呼風險 */
export const RISK_NAME: Record<RiskLevel, string> = {
  none: '不耗用現金（無風險）',
  low: '耗用現金（低風險）',
  medium: '耗用現金（中風險）',
  high: '耗用現金（高風險）',
}

/** 名稱字面對不上的兩種情況另外寫清楚：現金不足、不耗用現金但存不到預計存款 */
export function riskText(evaluation: Evaluation): string {
  if (evaluation.cashCheck === '不足') return '買房現金不足（高風險）'
  const level = riskLevel(evaluation)
  if (level === 'low' && !evaluation.runway.burnsCash) return '不耗用現金，但存不到預計存款（低風險）'
  return RISK_NAME[level]
}
