import { inTauri } from './files'

/**
 * 從 TradingView 取得匯率與 BTC 價格。
 * 網頁上的價格是載入後才畫出來的，直接抓網頁抓不到，
 * 所以改問它的查價介面（scanner），資料來源是同一個。
 */
const SCANNER = 'https://scanner.tradingview.com'

/** 台幣對美元：頁面 TWDUSD 是「1 台幣值幾美元」，要倒數；備用 USDTWD 直接用 */
const USD_TWD_TICKERS = [
  { ticker: 'FX_IDC:TWDUSD', invert: true },
  { ticker: 'FX_IDC:USDTWD', invert: false },
]
const BTC_USD_TICKERS = ['BITSTAMP:BTCUSD', 'COINBASE:BTCUSD']

interface ScanResponse {
  data?: { s: string; d: (number | null)[] }[]
}

/** 從查價回應裡取出某個代碼的最新價；找不到回傳 null */
export function parseClose(response: unknown, ticker: string): number | null {
  const rows = (response as ScanResponse | null)?.data
  if (!Array.isArray(rows)) return null
  const row = rows.find((item) => item.s === ticker)
  const close = row?.d?.[0]
  return typeof close === 'number' && Number.isFinite(close) && close > 0 ? close : null
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const fetchImpl = inTauri() ? (await import('@tauri-apps/plugin-http')).fetch : fetch
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`查價失敗（${response.status}）`)
  return response.json()
}

async function scan(market: 'forex' | 'crypto', tickers: string[]): Promise<unknown> {
  return postJson(`${SCANNER}/${market}/scan`, { symbols: { tickers }, columns: ['close'] })
}

export interface LiveRates {
  usdTwd: number
  btcUsd: number
}

export async function fetchLiveRates(): Promise<LiveRates> {
  const [forex, crypto] = await Promise.all([
    scan('forex', USD_TWD_TICKERS.map((item) => item.ticker)),
    scan('crypto', BTC_USD_TICKERS),
  ])

  let usdTwd: number | null = null
  for (const { ticker, invert } of USD_TWD_TICKERS) {
    const close = parseClose(forex, ticker)
    if (close !== null) {
      usdTwd = invert ? 1 / close : close
      break
    }
  }
  const btcUsd = BTC_USD_TICKERS.map((ticker) => parseClose(crypto, ticker)).find((value) => value !== null) ?? null

  if (usdTwd === null || btcUsd === null) throw new Error('查不到最新價格，請手動輸入')
  return { usdTwd, btcUsd }
}
