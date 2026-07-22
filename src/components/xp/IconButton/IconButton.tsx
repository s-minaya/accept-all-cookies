import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.scss'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'aria-label'
> {
  icon: string
  /** Se usa siempre como nombre accesible; también se muestra como texto visible cuando `showLabel` está activo. */
  label: string
  showLabel?: boolean
}

/**
 * Botón de icono retro 8-bit (GDD §1.1 / 003-plan.md "Decisiones"): borde
 * negro puro y sombra dura, un tercer lenguaje visual además del sistema XP
 * y el botón *cute*. Reutilizado por el `CornerMenu` de la landing y el
 * botón de volver de la pantalla de selección.
 */
export function IconButton({ icon, label, showLabel, className, ...rest }: IconButtonProps) {
  const classes = [styles['icon-button'], className].filter(Boolean).join(' ')

  return (
    <button type="button" className={classes} aria-label={label} {...rest}>
      <span className={styles['icon-button__box']}>
        <img src={icon} alt="" className={styles['icon-button__icon']} />
      </span>
      {showLabel && <span className={styles['icon-button__caption']}>{label}</span>}
    </button>
  )
}
