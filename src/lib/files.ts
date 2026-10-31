import { parseScenario, serializeScenario } from './scenarioFile'
import type { Scenario } from '../core'

const FILTERS = [{ name: '換屋試算', extensions: ['json'] }]
const DEFAULT_NAME = '換屋試算.json'

export const inTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** 存成檔案。回傳 false 代表使用者取消 */
export async function saveScenarioToFile(scenario: Scenario): Promise<boolean> {
  const text = serializeScenario(scenario)
  if (inTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({ defaultPath: DEFAULT_NAME, filters: FILTERS })
    if (!path) return false
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(path, text)
    return true
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = DEFAULT_NAME
  link.click()
  URL.revokeObjectURL(url)
  return true
}

/** 從檔案載入。回傳 null 代表使用者取消 */
export async function loadScenarioFromFile(): Promise<Scenario | null> {
  if (inTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const path = await open({ multiple: false, directory: false, filters: FILTERS })
    if (typeof path !== 'string') return null
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    return parseScenario(await readTextFile(path))
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      try {
        resolve(parseScenario(await file.text()))
      } catch (error) {
        reject(error)
      }
    }
    input.click()
  })
}
