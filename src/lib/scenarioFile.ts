import { createDefaultScenario } from '../core'
import type { Loan, LoanKind, Scenario } from '../core'

const APP_ID = 'home-swap-estimator'
const FILE_VERSION = 1
const STORAGE_KEY = 'home-swap-estimator:scenario'

interface ScenarioFile {
  app: typeof APP_ID
  version: number
  savedAt: string
  scenario: Scenario
}

export function serializeScenario(scenario: Scenario): string {
  const file: ScenarioFile = { app: APP_ID, version: FILE_VERSION, savedAt: new Date().toISOString(), scenario }
  return JSON.stringify(file, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 早期存檔的貸款類型寫的是中文，換成現在的英文代碼 */
function upgradeLoanKind(loan: Loan): Loan {
  const legacy: Record<string, LoanKind> = { 房貸: 'mortgage', 信貸: 'personal' }
  return { ...loan, kind: legacy[loan.kind] ?? loan.kind }
}

/** 讀檔。缺的欄位用範例補上，這樣舊版存檔升級後也能打開；格式不對就丟錯 */
export function parseScenario(text: string): Scenario {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('這個檔案不是有效的 JSON，打不開')
  }
  if (!isRecord(raw) || raw.app !== APP_ID || !isRecord(raw.scenario)) {
    throw new Error('這不是「換屋財務評估」存的檔案')
  }
  const base = createDefaultScenario()
  const saved = raw.scenario as Partial<Scenario>
  return {
    household: { ...base.household, ...saved.household },
    assets: Array.isArray(saved.assets) ? saved.assets : base.assets,
    rates: { ...base.rates, ...saved.rates },
    loans: Array.isArray(saved.loans) ? saved.loans.map(upgradeLoanKind) : base.loans,
    seller: { ...base.seller, ...saved.seller },
    buyer: { ...base.buyer, ...saved.buyer },
  }
}

/** 啟動時還原上次的內容；沒有或壞掉就用範例 */
export function loadAutosave(): Scenario {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (text) return parseScenario(text)
  } catch {
    // 讀不到就用範例
  }
  return createDefaultScenario()
}

export function writeAutosave(scenario: Scenario): void {
  try {
    localStorage.setItem(STORAGE_KEY, serializeScenario(scenario))
  } catch {
    // 空間不足或被禁用時不影響使用
  }
}
