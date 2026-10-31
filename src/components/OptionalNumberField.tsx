import { useEffect, useState } from 'react'
import { fmtMoney, parseNumber } from '../lib/format'

interface Props {
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
  suffix?: string
  label: string
}

/** 可以留白的數字欄位。留白＝沒填（資料裡是 null） */
export function OptionalNumberField({ value, onChange, placeholder = '沒填', suffix, label }: Props) {
  const [text, setText] = useState(value === null ? '' : fmtMoney(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setText(value === null ? '' : fmtMoney(value))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    onChange(parseNumber(text))
  }

  return (
    <span className="number-field">
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        placeholder={placeholder}
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
