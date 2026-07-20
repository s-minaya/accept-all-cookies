import type { ReactNode } from 'react'
import styles from './XPToggle.module.css'

export interface XPToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
}

/** XP-styled switch over a native checkbox (keyboard/screen-reader support for free). */
export function XPToggle({ checked, onChange, label }: XPToggleProps) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.labelText}>{label}</span>}
    </label>
  )
}
