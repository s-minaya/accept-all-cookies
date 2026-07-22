import type { InputHTMLAttributes } from 'react'
import styles from './XPTextInput.module.scss'

export type XPTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * Campo de texto hundido clásico. `font-size` se fija en 1rem (16px, la
 * base del proyecto) para que enfocarlo nunca dispare el auto-zoom de
 * iOS Safari.
 */
export function XPTextInput({ className, ...rest }: XPTextInputProps) {
  const classes = [styles['xp-text-input'], className].filter(Boolean).join(' ')
  return <input type="text" className={classes} {...rest} />
}
