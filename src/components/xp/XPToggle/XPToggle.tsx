import type { ReactNode } from 'react'
import styles from './XPToggle.module.scss'

export interface XPToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
}

/** XP-styled switch over a native checkbox (keyboard/screen-reader support for free). */
export function XPToggle({ checked, onChange, label }: XPToggleProps) {
  return (
    <label className={styles['xp-toggle']}>
      <input
        type="checkbox"
        className={styles['xp-toggle__input']}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles['xp-toggle__track']}>
        <span className={styles['xp-toggle__thumb']} />
      </span>
      {label && <span className={styles['xp-toggle__label-text']}>{label}</span>}
    </label>
  )
}
