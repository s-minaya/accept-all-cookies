import styles from './XPSlider.module.scss'

export interface XPSliderProps {
  min: number
  max: number
  step?: number
  value: number
  /** Se dispara en cada tick del arrastre (en vivo), para que el audio/volumen se actualice al instante. */
  onChange: (value: number) => void
  /** Se dispara cuando el usuario suelta el slider (puntero o tecla), no en cada tick. */
  onCommit?: () => void
  ariaLabel?: string
}

/** `<input type="range">` nativo, re-estilizado: conserva la accesibilidad y el manejo táctil de serie. */
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
