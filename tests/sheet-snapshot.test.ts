import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { evaluate } from '../src/core'
import type { Scenario } from '../src/core'

// 這份快照是試算表當時的真實數字，含個人資料，所以不進 git（見 .gitignore）。
// 沒有這個檔案時會自動略過。
const path = new URL('./fixtures/sheet-snapshot.local.json', import.meta.url)

describe.skipIf(!existsSync(path))('跟試算表的數字對照', () => {
  const snapshot = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null
  const [y, m, d] = (snapshot?.today ?? '2026-01-01').split('-').map(Number)
  const result = evaluate(snapshot?.scenario as Scenario, new Date(y, m - 1, d))
  const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThan(100)

  it('現金', () => {
    near(result.assetsTotal, snapshot.expected.assetsTotal)
    near(result.payoffTotal, snapshot.expected.payoffTotal)
    near(result.availableCash, snapshot.expected.availableCash)
    near(result.remainingCash, snapshot.expected.remainingCash)
  })

  it('年收支', () => {
    near(result.annualPayment, snapshot.expected.annualPayment)
    near(result.budgetSlack, snapshot.expected.budgetSlack)
    near(result.monthlyOutflow, snapshot.expected.monthlyOutflow)
  })

  it('現金續航', () => {
    expect(result.runway.months).toBe(snapshot.expected.runwayMonths)
    expect(result.runway.firstPositiveMonth).toBe(snapshot.expected.firstPositiveMonth)
    near(result.runway.lowestCash, snapshot.expected.lowestCash)
  })

  it('最高房價與淨資產', () => {
    near(result.maxPrice.byRunway, snapshot.expected.byRunway)
    near(result.netWorthBefore, snapshot.expected.netWorthBefore)
    near(result.netWorthAfter, snapshot.expected.netWorthAfter)
  })

  it('結論', () => {
    expect(result.verdict).toBe(snapshot.expected.verdict)
  })
})
