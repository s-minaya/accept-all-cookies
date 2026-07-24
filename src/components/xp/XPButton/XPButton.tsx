import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styles from './XPButton.module.scss'

export type XPButtonVariant = 'agree' | 'disagree' | 'neutral'

export interface XPButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: XPButtonVariant
  children: ReactNode
}

/**
 * `ref` reenviado al `<button>` real: lo necesita el nivel 3 (007-plan.md)
 * para sincronizar la posición de los Disagree de la lluvia (cuerpos de
 * matter.js) escribiendo `style.transform` directamente por rAF, sin pasar
 * por el ciclo de render de React en cada paso de física.
 */
export const XPButton = forwardRef<HTMLButtonElement, XPButtonProps>(function XPButton(
  { variant, children, className, ...rest },
  ref,
) {
  const classes = [styles['xp-button'], styles[`xp-button--${variant}`], className]
    .filter(Boolean)
    .join(' ')

  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      <span className={styles['xp-button__label']}>{children}</span>
    </button>
  )
})
