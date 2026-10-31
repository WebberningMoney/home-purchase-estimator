import { useCallback, useEffect, useState } from 'react'
import { createDefaultScenario } from '../core'
import type { Scenario } from '../core'
import { loadAutosave, writeAutosave } from '../lib/scenarioFile'

/** 全部輸入資料放這裡。每次改動會自動存在本機，下次打開還在 */
export function useScenario() {
  const [scenario, setScenario] = useState<Scenario>(loadAutosave)

  useEffect(() => {
    const timer = setTimeout(() => writeAutosave(scenario), 300)
    return () => clearTimeout(timer)
  }, [scenario])

  /** 在複製的資料上修改，再整份換掉 */
  const update = useCallback((change: (draft: Scenario) => void) => {
    setScenario((previous) => {
      const next = structuredClone(previous)
      change(next)
      return next
    })
  }, [])

  const replace = useCallback((next: Scenario) => setScenario(next), [])
  const reset = useCallback(() => setScenario(createDefaultScenario()), [])

  return { scenario, update, replace, reset }
}
