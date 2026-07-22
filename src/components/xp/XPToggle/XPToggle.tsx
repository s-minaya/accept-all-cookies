import type { ReactNode } from 'react'
import styles from './XPToggle.module.scss'

export interface XPToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
}

/** Interruptor con estética XP sobre un checkbox nativo (soporte de teclado/lector de pantalla gratis). */
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
