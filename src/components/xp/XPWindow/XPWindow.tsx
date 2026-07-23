import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPWindow.module.scss'

export interface XPWindowProps {
  title: string
  /** Omitir junto con `onClose`/`closeLabel` para ocultar el contador (p. ej. la pantalla de selección, GDD §5.1). */
  counter?: number
  closeLabel?: string
  /** Omitir para ocultar el botón X (p. ej. la pantalla de selección, GDD §5.1). */
  onClose?: () => void
  /** Omitir para ocultar el recuadro de consentimiento (p. ej. la pantalla de selección, que no tiene texto de categoría). */
  consentText?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /**
   * Accesorio anclado dentro del cuerpo beige: arriba a la izquierda en
   * tablet/escritorio, abajo a la izquierda en móvil (p. ej. el botón de
   * volver de la pantalla de selección, GDD §5.1).
   */
  cornerAccessory?: ReactNode
  /** El interior crece y hace scroll propio en vez del alto fijo pensado para el área de juego (p. ej. la lista de niveles). */
  scrollableContent?: boolean
}

export function XPWindow({
  title,
  counter,
  closeLabel,
  onClose,
  consentText,
  children,
  footer,
  cornerAccessory,
  scrollableContent,
}: XPWindowProps) {
  const windowClasses = [styles['xp-window'], scrollableContent && styles['xp-window--fill-height']]
    .filter(Boolean)
    .join(' ')
  const interiorClasses = [
    styles['xp-window__interior'],
    scrollableContent && styles['xp-window__interior--scrollable'],
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={windowClasses}>
      <TitleBar title={title} counter={counter} onClose={onClose} closeLabel={closeLabel} />

      <div className={styles['xp-window__body']}>
        {cornerAccessory && (
          <div className={styles['xp-window__corner-accessory']}>{cornerAccessory}</div>
        )}

        {consentText && <div className={styles['xp-window__consent-box']}>{consentText}</div>}

        <div className={styles['xp-window__frame']}>
          <div className={interiorClasses}>{children}</div>
        </div>

        {footer && <div className={styles['xp-window__footer']}>{footer}</div>}
      </div>
    </div>
  )
}
