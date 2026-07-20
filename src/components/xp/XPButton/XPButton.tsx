import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './XPButton.module.scss'

export type XPButtonVariant = 'agree' | 'disagree' | 'neutral'

export interface XPButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: XPButtonVariant
  children: ReactNode
}

export function XPButton({ variant, children, className, ...rest }: XPButtonProps) {
  const classes = [styles['xp-button'], styles[`xp-button--${variant}`], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} {...rest}>
      <span className={styles['xp-button__label']}>{children}</span>
    </button>
  )
}
