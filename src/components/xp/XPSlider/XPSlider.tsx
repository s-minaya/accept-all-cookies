import styles from './XPSlider.module.scss'

export interface XPSliderProps {
  min: number
  max: number
  step?: number
  value: number
  /** Fires on every drag tick (live), so audio/volume can update immediately. */
  onChange: (value: number) => void
  /** Fires when the user releases the slider (pointer or key), not on every tick. */
  onCommit?: () => void
  ariaLabel?: string
}

/** Native `<input type="range">`, re-styled: keeps built-in accessibility and touch handling. */
export function XPSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onCommit,
  ariaLabel,
}: XPSliderProps) {
  return (
    <input
      type="range"
      className={styles['xp-slider']}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      aria-label={ariaLabel}
    />
  )
}
