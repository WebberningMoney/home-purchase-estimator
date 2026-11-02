import { useState } from 'react'
import { assetValue, usableValue } from '../core'
import type { Evaluation, Scenario } from '../core'
import { fmtBig, fmtMoney } from '../lib/format'
import { fetchLiveRates } from '../lib/rates'
import { NumberField } from './NumberField'
import { Row, Section } from './Section'
import { SliderField } from './SliderField'
import { Toggle } from './Toggle'

interface Props {
  scenario: Scenario
  evaluation: Evaluation
  onChange: (change: (draft: Scenario) => void) => void
}

const UNIT: Record<string, string> = { usStock: '美元', btc: '顆' }

type RateStatus = { kind: 'idle' } | { kind: 'loading' } | { kind: 'ok'; at: string } | { kind: 'error'; message: string }

/** 資產：每一類一張卡，先填現值，再決定買房時動用幾成 */
export function AssetsPanel({ scenario, evaluation, onChange }: Props) {
  const { assets, rates } = scenario
  const usableShare = evaluation.assetsTotal > 0 ? (evaluation.usableAssets / evaluation.assetsTotal) * 100 : 0
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
      <div className="asset-overview">
        <div className="asset-bar" aria-hidden="true">
          <span className="asset-bar-use" style={{ width: `${usableShare}%` }} />
        </div>
        <div className="asset-legend">
          <span>
            <i className="dot use" />
            買房動用 <b>{fmtBig(evaluation.usableAssets)}</b>
          </span>
          <span>
            <i className="dot keep" />
            留著不動 <b>{fmtBig(evaluation.unusedAssets)}</b>
          </span>
        </div>
      </div>
      <p className="hint block">每一筆資產：先填現在值多少，再決定買房時要不要動用、動用幾成。</p>

      <div className="asset-list">
        {assets.map((asset, index) => {
          const unit = UNIT[asset.key]
          return (
            <article className={`asset-card ${asset.use ? 'on' : ''}`} key={asset.key}>
              <header className="asset-head">
                <span className="asset-name">{asset.name}</span>
                <Toggle
                  checked={asset.use}
                  onChange={(checked) => onChange((d) => void (d.assets[index].use = checked))}
                  label={`買房時動用${asset.name}`}
                  text={asset.use ? '買房動用' : '不動用'}
                />
              </header>
              <div className="asset-amount">
                <NumberField
                  value={asset.amount}
                  onChange={(value) => onChange((d) => void (d.assets[index].amount = value))}
                  decimals={asset.key === 'btc' ? 4 : 0}
                  min={0}
                  suffix={unit ?? '元'}
                  label={`${asset.name}現值`}
                />
                {unit && <span className="hint">≈ {fmtMoney(assetValue(asset, rates))} 元</span>}
              </div>
              {asset.use && (
                <SliderField
                  label="動用幾成"
                  value={asset.ratio}
                  onChange={(value) => onChange((d) => void (d.assets[index].ratio = value))}
                  min={0}
                  max={1}
                  step={0.05}
                  scale={100}
                  decimals={0}
                  suffix="%"
                  minLabel="0%"
                  maxLabel="100%"
                  hint={`買房時拿出 ${fmtBig(usableValue(asset, rates))}`}
                />
              )}
            </article>
          )
        })}
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
