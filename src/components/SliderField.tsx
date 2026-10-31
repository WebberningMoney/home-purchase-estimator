import { useMemo } from 'react'
import { zonesGradient } from '../lib/zones'
import type { Tone } from '../lib/zones'
import { NumberField } from './NumberField'

interface Props {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  /** 手動輸入框的單位換算，見 NumberField */
  scale?: number
  decimals?: number
  suffix?: string
  /** 拉桿兩端要顯示的文字 */
  minLabel: string
  maxLabel: string
  /** 拉桿每一點對應的狀態，用來上色；不給就是單色 */
  tones?: Tone[]
}

/** 拉桿加手動輸入。拉桿底色會告訴你拉到哪裡開始買不起 */
export function SliderField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  scale,
  decimals,
  suffix,
  minLabel,
  maxLabel,
  tones,
}: Props) {
  const gradient = useMemo(() => (tones ? zonesGradient(tones) : undefined), [tones])
  const clamped = Math.min(max, Math.max(min, value))
  const outside = value < min || value > max

  return (
    <div className="slider-field">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <NumberField
          value={value}
          onChange={onChange}
          scale={scale}
          decimals={decimals}
          suffix={suffix}
          label={label}
          className="slider-number"
        />
      </div>
      <div className="slider-track">
        <div className="slider-zones" style={gradient ? { background: gradient } : undefined} />
        <input
          type="range"
          aria-label={`${label}拉桿`}
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <div className="slider-scale">
        <span>{minLabel}</span>
        {outside && <span className="slider-outside">目前的值超出拉桿範圍</span>}
        <span>{maxLabel}</span>
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
