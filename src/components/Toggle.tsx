interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** 開關旁邊顯示的字，例如「動用」 */
  text?: string
}

export function Toggle({ checked, onChange, label, text }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
      {text && <span className="toggle-text">{text}</span>}
    </button>
  )
}
