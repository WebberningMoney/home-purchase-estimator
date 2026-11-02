import { useMemo, useState } from 'react'
import { evaluate, findMaxAffordable } from './core'
import type { Scenario } from './core'
import { AssetsPanel } from './components/AssetsPanel'
import { BuyerPanel, LTV_RANGE, PRICE_RANGE, RATE_RANGE } from './components/BuyerPanel'
import { Capacity } from './components/Capacity'
import { CashChart } from './components/CashChart'
import { HouseholdPanel } from './components/HouseholdPanel'
import { KeyFigures } from './components/KeyFigures'
import { LoansPanel } from './components/LoansPanel'
import { SellerPanel } from './components/SellerPanel'
import { Verdict } from './components/Verdict'
import { loadScenarioFromFile, saveScenarioToFile } from './lib/files'
import { sampleTones } from './lib/zones'
import type { Tone } from './lib/zones'
import { useScenario } from './state/useScenario'

type Apply = (draft: Scenario, value: number) => void

/**
 * 某根拉桿從頭拉到尾的狀態。
 * 拉桿自己的值不影響掃描結果，所以把它固定後再比對，拖動時不會重算。
 */
function useSweep(scenario: Scenario, today: Date, range: { min: number; max: number }, apply: Apply): Tone[] {
  const fixed = structuredClone(scenario)
  apply(fixed, range.min)
  const key = JSON.stringify(fixed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => sampleTones(scenario, apply, range.min, range.max, today), [key, today])
}

/** 整個畫面：左邊調數字，右邊看結果 */
export function App() {
  const { scenario, update, replace, reset } = useScenario()
  const [notice, setNotice] = useState('')
  const today = useMemo(() => new Date(), [])

  const evaluation = useMemo(() => evaluate(scenario, today), [scenario, today])

  const maxAffordable = useMemo(() => findMaxAffordable(scenario, today), [scenario, today])

  const priceTones = useSweep(scenario, today, PRICE_RANGE, (d, v) => void (d.buyer.price = v))
  const rateTones = useSweep(scenario, today, RATE_RANGE, (d, v) => void (d.buyer.annualRate = v))
  const ltvTones = useSweep(scenario, today, LTV_RANGE, (d, v) => void (d.buyer.ltv = v))

  const flash = (text: string) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 2500)
  }

  const save = async () => {
    try {
      if (await saveScenarioToFile(scenario)) flash('已存檔')
    } catch (error) {
      flash(`存檔失敗：${error instanceof Error ? error.message : '未知原因'}`)
    }
  }

  const load = async () => {
    try {
      const loaded = await loadScenarioFromFile()
      if (loaded) {
        replace(loaded)
        flash('已載入')
      }
    } catch (error) {
      flash(`載入失敗：${error instanceof Error ? error.message : '檔案格式不對'}`)
    }
  }

  const resetAll = () => {
    if (window.confirm('要回到範例數字嗎？目前輸入的內容會消失（可先存檔）。')) reset()
  }

  return (
    <div className="app">
      <header className="toolbar" data-tauri-drag-region>
        <span className="brand">換屋底氣</span>
        <span className="tagline">買得起，也撐得住</span>
        <span className="notice" role="status">
          {notice}
        </span>
        <div className="toolbar-actions">
          <button type="button" className="button" onClick={load}>
            開啟檔案
          </button>
          <button type="button" className="button" onClick={save}>
            儲存檔案
          </button>
          <button type="button" className="button ghost" onClick={resetAll}>
            重設
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="inputs">
          <BuyerPanel
            scenario={scenario}
            evaluation={evaluation}
            priceTones={priceTones}
            rateTones={rateTones}
            ltvTones={ltvTones}
            onChange={update}
          />
          <HouseholdPanel scenario={scenario} evaluation={evaluation} onChange={update} />
          <AssetsPanel scenario={scenario} evaluation={evaluation} onChange={update} />
          <LoansPanel scenario={scenario} evaluation={evaluation} onChange={update} />
          <SellerPanel scenario={scenario} evaluation={evaluation} onChange={update} />
        </div>

        <div className="board">
          <Verdict scenario={scenario} evaluation={evaluation} max={maxAffordable} />
          <Capacity scenario={scenario} evaluation={evaluation} max={maxAffordable} />
          <CashChart scenario={scenario} evaluation={evaluation} />
          <KeyFigures scenario={scenario} evaluation={evaluation} />
        </div>
      </main>
    </div>
  )
}
