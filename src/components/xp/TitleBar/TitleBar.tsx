import { forwardRef } from 'react'
import styles from './TitleBar.module.scss'

export interface TitleBarProps {
  title: string
  counter?: number
  onClose?: () => void
  closeLabel?: string
}

/**
 * `ref` reenviado al `<div>` de la barra de título real: lo necesita el
 * nivel 10 (014-plan.md) para enganchar `usePointer` solo sobre la barra de
 * título de cada ventana (arrastrar para duplicar), no sobre la ventana
 * entera — a diferencia del nivel 3, que rota desde cualquier punto.
 */
export const TitleBar = forwardRef<HTMLDivElement, TitleBarProps>(function TitleBar(
  { title, counter, onClose, closeLabel },
  ref,
) {
  return (
    <div ref={ref} className={styles['title-bar']}>
      <span className={styles['title-bar__counter']}>{counter ?? ''}</span>
      <span className={styles['title-bar__title']}>{title}</span>
      {onClose ? (
        <button
          type="button"
          className={styles['title-bar__close-button']}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <span className={styles['title-bar__close-chip']}>
            <svg viewBox="0 0 10 10" aria-hidden="true" className={styles['title-bar__close-icon']}>
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </span>
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  )
})
