import type { ButtonHTMLAttributes, ReactNode } from 'react'
import heartIcon from '../../../assets/images/ui/heart.png'
import styles from './CuteButton.module.scss'

export interface CuteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/**
 * El botón "Empezar" de la landing: pixel art *cute*, deliberadamente fuera
 * del sistema XP (GDD §1.1, 003-spec.md) — un lenguaje visual distinto de
 * `components/xp/`, nunca reutilizado dentro de un nivel.
 */
export function CuteButton({ children, className, ...rest }: CuteButtonProps) {
  const classes = [styles['cute-button'], className].filter(Boolean).join(' ')

  return (
    <button type="button" className={classes} {...rest}>
      <span className={styles['cute-button__label']}>{children}</span>
      <img src={heartIcon} alt="" className={styles['cute-button__heart']} />
    </button>
  )
}
