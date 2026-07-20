import type { ButtonHTMLAttributes, ReactNode } from 'react'
import heartIcon from '../../../assets/images/ui/heart.png'
import styles from './CuteButton.module.scss'

export interface CuteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/**
 * The landing's "Empezar" button: cute pixel art, deliberately not part of
 * the XP system (GDD §1.1, 003-spec.md) — a different visual language from
 * `components/xp/`, never reused for in-level UI.
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
