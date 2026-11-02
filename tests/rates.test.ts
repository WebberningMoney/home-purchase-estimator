import { describe, expect, it } from 'vitest'
import { parseClose } from '../src/lib/rates'
import { parseScenario, serializeScenario } from '../src/lib/scenarioFile'
import { createDefaultScenario } from '../src/core'

describe('查價回應', () => {
  const response = { data: [{ s: 'FX_IDC:TWDUSD', d: [0.0307] }, { s: 'BITSTAMP:BTCUSD', d: [null] }] }

  it('取出對應代碼的最新價', () => {
    expect(parseClose(response, 'FX_IDC:TWDUSD')).toBe(0.0307)
  })

  it('沒有這個代碼或價格是空的，回傳 null', () => {
    expect(parseClose(response, 'FX_IDC:USDTWD')).toBeNull()
    expect(parseClose(response, 'BITSTAMP:BTCUSD')).toBeNull()
    expect(parseClose({}, 'FX_IDC:TWDUSD')).toBeNull()
  })
})

describe('存檔與載入', () => {
  it('存出去再讀回來內容一樣', () => {
    const scenario = createDefaultScenario()
    expect(parseScenario(serializeScenario(scenario))).toEqual(scenario)
  })

  it('缺少欄位時用範例補上', () => {
    const text = JSON.stringify({ app: 'home-swap-estimator', version: 1, scenario: { buyer: { price: 1 } } })
    const loaded = parseScenario(text)
    expect(loaded.buyer.price).toBe(1)
    expect(loaded.buyer.ltv).toBe(createDefaultScenario().buyer.ltv)
  })

  it('不是這個 App 存的檔案會擋下來', () => {
    expect(() => parseScenario('{"hello":1}')).toThrow('不是「換屋底氣」')
    expect(() => parseScenario('not json')).toThrow('JSON')
  })
})
