import { describe, expect, it } from 'vitest'
import { createDefaultScenario } from '../src/core'
import { parseScenario } from '../src/lib/scenarioFile'

describe('讀取舊版存檔', () => {
  it('已取消的「收入中斷月數」不會帶進來，其他設定照舊', () => {
    const scenario = createDefaultScenario()
    const oldHousehold = { ...scenario.household, interruptMonths: 12, warnMonths: 24 }
    const text = JSON.stringify({ app: 'home-swap-estimator', version: 1, scenario: { ...scenario, household: oldHousehold } })

    const loaded = parseScenario(text)

    expect(loaded.household).not.toHaveProperty('interruptMonths')
    expect(loaded.household.warnMonths).toBe(24)
    expect(loaded.household.sources).toHaveLength(scenario.household.sources.length)
  })
})
