import type { ReactNode } from 'react'

interface Props {
  title: string
  /** 收合時也看得到的一句話摘要 */
  summary?: string
  defaultOpen?: boolean
  /** 標題列右邊的控制項，例如開關 */
  action?: ReactNode
  /** 內容反白、不能編輯 */
  disabled?: boolean
  children: ReactNode
}

export function Section({ title, summary, defaultOpen = false, action, disabled = false, children }: Props) {
  return (
    <details className="section" open={defaultOpen}>
      <summary>
        <span className="section-title">{title}</span>
        {summary && <span className="section-summary">{summary}</span>}
        {action && (
          // 點開關不該順便把區塊收起來
          <span className="section-action" onClick={(event) => event.preventDefault()}>
            {action}
          </span>
        )}
      </summary>
      <fieldset className="section-body" disabled={disabled}>
        {children}
      </fieldset>
    </details>
  )
}

/** 一列：左邊說明、右邊放欄位 */
export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="row">
      <div className="row-label">
        <span>{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div className="row-control">{children}</div>
    </div>
  )
}
