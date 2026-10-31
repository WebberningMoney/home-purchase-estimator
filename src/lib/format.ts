const group = (n: number) => Math.round(n).toLocaleString('en-US')

/** 3,861,956 */
export function fmtMoney(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return group(value)
}

/** 1,800 萬；不到一萬就直接顯示元 */
export function fmtWan(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) < 10000) return `${group(value)} 元`
  return `${(value / 10000).toLocaleString('en-US', { maximumFractionDigits: 0 })} 萬`
}

/** 看起來最順的金額寫法：一億以上寫「1.2 億」，其餘寫「萬」 */
export function fmtBig(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 100_000_000) return `${(value / 100_000_000).toFixed(2)} 億`
  return fmtWan(value)
}

export function fmtPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** 37 個月（3.1 年） */
export function fmtMonths(months: number): string {
  return `${Math.round(months)} 個月（${(months / 12).toFixed(1)} 年）`
}

/** 把使用者打的字（可能含逗號）轉成數字，轉不出來回傳 null */
export function parseNumber(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, '')
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}
