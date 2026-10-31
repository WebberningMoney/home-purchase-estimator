import type { Seller } from './types'

/** 賣方的房屋賣價 */
export function salePrice(seller: Seller): number {
  return seller.unitPrice * seller.ping
}

/**
 * 房地合一稅（簡化估算）。
 * 沒填原買價或持有年數就當 0；不含裝修費與重購退稅。
 */
export function capitalGainsTax(seller: Seller): number {
  if (seller.originalPrice === null || seller.holdingYears === null) return 0
  const price = salePrice(seller)
  const gain = price - price * seller.feeRate - seller.originalPrice
  if (seller.ownerOccupiedExempt && seller.holdingYears >= 6) {
    return Math.max(0, gain - 4_000_000) * 0.1
  }
  const years = seller.holdingYears
  const rate = years <= 2 ? 0.45 : years <= 5 ? 0.35 : years <= 10 ? 0.2 : 0.15
  return Math.max(0, gain) * rate
}
