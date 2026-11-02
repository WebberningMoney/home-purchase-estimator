export type Platform = 'macos' | 'other'

/** 只有 macOS 的視窗標題列是透明疊在畫面上的，工具列要替左上角的紅黃綠按鈕留位置；其他系統用原生標題列，不用留 */
export function detectPlatform(userAgent: string): Platform {
  return userAgent.includes('Macintosh') ? 'macos' : 'other'
}
