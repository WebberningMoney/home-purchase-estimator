import type { Asset, Rates } from './types'

/** 這項資產折成新台幣是多少。美股填美元、BTC 填顆數，要乘上匯率 */
export function assetValue(asset: Asset, rates: Rates): number {
  if (asset.key === 'usStock') return asset.amount * rates.usdTwd
  if (asset.key === 'btc') return asset.amount * rates.btcUsd * rates.usdTwd
  return asset.amount
}

/** 買房時實際能拿來用的金額＝市值 × 動用比例（只算選「動用」的） */
export function usableValue(asset: Asset, rates: Rates): number {
  return asset.use ? assetValue(asset, rates) * asset.ratio : 0
}
