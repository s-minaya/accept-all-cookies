import type { ButtonHTMLAttributes } from 'react'
import styles from './IconButton.module.scss'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'aria-label'
> {
  icon: string
  /** Always used as the accessible name; also shown as a visible caption when `showLabel` is set. */
  label: string
  showLabel?: boolean
}

/**
 * Retro 8-bit icon button (GDD §1.1 / 003-plan.md "Decisiones"): pure-black
 * hard-shadow chrome, a third visual language besides the XP system and the
 * cute button. Reused by the landing's `CornerMenu` and the select screen's
 * back button.
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
