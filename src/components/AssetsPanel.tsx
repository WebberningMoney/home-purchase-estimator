import { useState } from 'react'
import { assetValue, usableValue } from '../core'
import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import { fetchLiveRates } from '../lib/rates'
import { NumberField } from './NumberField'
import { Row, Section } from './Section'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

const UNIT: Record<string, string> = { usStock: '美元', btc: '顆' }

type RateStatus = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; at: string } | { kind: 'error'; message: string }

/** 資產：每一類一列，選要不要動用、動用幾成 */
export function AssetsPanel({ scenario, evaluation, onChange }: Props) {
  const { assets, rates } = scenario
  const [status, setStatus] = useState<RateStatus>({ kind: 'idle' })

  const refreshRates = async () => {
    setStatus({ kind: 'loading' })
    try {
      const live = await fetchLiveRates()
      onChange((d) => {
        d.rates.usdTwd = Number(live.usdTwd.toFixed(4))
        d.rates.btcUsd = Number(live.btcUsd.toFixed(2))
      })
      setStatus({ kind: 'ok', at: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) })
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : '更新失敗，請手動輸入' })
    }
  }

  return (
    <Section
      title="資產"
      summary={`共 ${fmtBig(evaluation.assetsTotal)}，買房會動用 ${fmtBig(evaluation.usableAssets)}`}
    >
      <p className="hint block">美股填美元、BTC 填顆數，會自動換成台幣。打開「動用」才會拿來買房。</p>
      <div className="asset-table" role="table">
        {assets.map((asset, index) => (
          <div className="asset-row" role="row" key={asset.key}>
            <div className="asset-name">
              <span>{asset.name}</span>
              <span className="hint">
                {UNIT[asset.key] ? `≈ ${fmtMoney(assetValue(asset, rates))} 元` : ''}
              </span>
            </div>
            <NumberField
              value={asset.amount}
              onChange={(value) => onChange((d) => void (d.assets[index].amount = value))}
              decimals={asset.key === 'btc' ? 4 : 0}
              min={0}
              suffix={UNIT[asset.key] ?? '元'}
              label={`${asset.name}金額`}
            />
            <Toggle
              checked={asset.use}
              onChange={(checked) => onChange((d) => void (d.assets[index].use = checked))}
              label={`動用${asset.name}`}
              text="動用"
            />
            <NumberField
              value={asset.ratio}
              onChange={(value) => onChange((d) => void (d.assets[index].ratio = value))}
              scale={100}
              min={0}
              max={1}
              suffix="%"
              label={`${asset.name}動用比例`}
              className={asset.use ? '' : 'dim'}
            />
            <span className="asset-usable">{asset.use ? fmtBig(usableValue(asset, rates)) : '—'}</span>
          </div>
        ))}
      </div>

      <Section title="匯率與幣價" summary={`1 美元 = ${rates.usdTwd.toFixed(3)} 元，BTC = ${Math.round(rates.btcUsd).toLocaleString('en-US')} 美元`}>
        <Row label="美元兌台幣" hint="1 美元可換幾元台幣">
          <NumberField
            value={rates.usdTwd}
            onChange={(value) => onChange((d) => void (d.rates.usdTwd = value))}
            decimals={4}
            min={0}
            label="美元兌台幣"
          />
        </Row>
        <Row label="BTC 價格" hint="1 顆 BTC 值幾美元">
          <NumberField
            value={rates.btcUsd}
            onChange={(value) => onChange((d) => void (d.rates.btcUsd = value))}
            decimals={2}
            min={0}
            suffix="美元"
            label="BTC 價格"
          />
        </Row>
        <div className="rates-action">
          <button type="button" className="button" onClick={refreshRates} disabled={status.kind === 'loading'}>
            {status.kind === 'loading' ? '更新中…' : '用 TradingView 更新'}
          </button>
          {status.kind === 'ok' && <span className="hint">已在 {status.at} 更新</span>}
          {status.kind === 'error' && <span className="hint error">{status.message}</span>}
        </div>
      </Section>
    </Section>
  )
}
