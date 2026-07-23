import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { useAudio } from '../../../audio/useAudio'
import heartIcon from '../../../assets/images/ui/heart.png'
import styles from './CuteButton.module.scss'

export interface CuteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

/**
 * El botón "Empezar" de la landing: pixel art *cute*, deliberadamente fuera
 * del sistema XP (GDD §1.1, 003-spec.md) — un lenguaje visual distinto de
 * `components/xp/`, nunca reutilizado dentro de un nivel. Sin animación de
 * pulsación: al tocarlo solo suena el sonido positivo.
 */
export function CuteButton({ children, className, onClick, ...rest }: CuteButtonProps) {
  const { playPositive } = useAudio()
  const classes = [styles['cute-button'], className].filter(Boolean).join(' ')

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    playPositive()
    onClick?.(event)
  }

  return (
    <button type="button" className={classes} onClick={handleClick} {...rest}>
      <span className={styles['cute-button__label']}>{children}</span>
      <img src={heartIcon} alt="" className={styles['cute-button__heart']} />
    </button>
  )
}
