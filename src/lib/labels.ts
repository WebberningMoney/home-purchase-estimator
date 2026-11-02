import type { Asset, LoanKind } from '../core'

/** 畫面上顯示的中文名稱。存檔只存英文代碼，所以名稱集中放這裡 */
export const ASSET_LABEL: Record<Asset['key'], string> = {
  twStock: '台股（個股）',
  twEtf: '台股（ETF）',
  usStock: '美股',
  fund: '基金',
  policy: '儲蓄型保單',
  btc: 'BTC',
  cash: '現金（活存、定存、外幣）',
}

export const LOAN_KIND_LABEL: Record<LoanKind, string> = {
  mortgage: '舊屋房貸',
  personal: '信貸／其他',
}
