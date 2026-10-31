import { useEffect, useState } from 'react'
import { fmtMoney, parseNumber } from '../lib/format'

interface Props {
  value: number
  onChange: (value: number) => void
  /** 畫面上的數字 = 資料 × scale。利率存小數、畫面顯示百分比時填 100 */
  scale?: number
  decimals?: number
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  label?: string
  className?: string
}

function show(value: number, scale: number, decimals: number): string {
  const shown = value * scale
  if (decimals === 0) return fmtMoney(shown)
  return shown.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals })
}

/** 可以直接打字的數字欄位。打到一半不會亂跳，離開欄位或按 Enter 才會套用 */
export function NumberField({
  value,
  onChange,
  scale = 1,
  decimals = 0,
  prefix,
  suffix,
  min,
  max,
  label,
  className,
}: Props) {
  const [text, setText] = useState(() => show(value, scale, decimals))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setText(show(value, scale, decimals))
  }, [value, scale, decimals, editing])

  const commit = () => {
    setEditing(false)
    const parsed = parseNumber(text)
    if (parsed === null) {
      setText(show(value, scale, decimals))
      return
    }
    let next = parsed / scale
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    onChange(next)
    setText(show(next, scale, decimals))
  }

  return (
    <span className={`number-field ${className ?? ''}`}>
      {prefix && <span className="affix">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        value={text}
        onFocus={(event) => {
          setEditing(true)
          event.currentTarget.select()
        }}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      {suffix && <span className="affix">{suffix}</span>}
    </span>
  )
}
