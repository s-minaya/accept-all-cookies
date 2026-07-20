import type { InputHTMLAttributes } from 'react'
import styles from './XPTextInput.module.css'

export type XPTextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

/**
 * Classic sunken text field. `font-size` is pinned at 1rem (16px, the
 * project's base) so focusing it never triggers iOS Safari's auto-zoom.
 */
export function XPTextInput({ className, ...rest }: XPTextInputProps) {
  const classes = [styles.input, className].filter(Boolean).join(' ')
  return <input type="text" className={classes} {...rest} />
}
