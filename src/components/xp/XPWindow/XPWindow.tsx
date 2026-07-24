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
  /**
   * Tablero de juego que se renderiza DEBAJO del marco azul, fuera de él, en
   * el espacio sobrante del cuerpo de la ventana (p. ej. el recuadro de
   * lluvia del nivel 3): a diferencia de `children`, el marco azul no lo
   * envuelve — se ajusta solo a `children` en vez de estirarse (corregido
   * tras revisión de Sofía: "el borde azul oscuro SOLO cubre los términos y
   * condiciones de las cookies").
   */
  boardBelowFrame?: ReactNode
  footer?: ReactNode
  /**
   * Accesorio anclado dentro del cuerpo beige: arriba a la izquierda en
   * tablet/escritorio, abajo a la izquierda en móvil (p. ej. el botón de
   * volver de la pantalla de selección, GDD §5.1).
   */
  cornerAccessory?: ReactNode
  /**
   * El interior hace scroll propio en vez del alto fijo pensado para el área
   * de juego (p. ej. el texto largo del nivel 1), acotado a un tamaño
   * moderado salvo que `fillHeight` también esté activo.
   */
  scrollableContent?: boolean
  /** La ventana ocupa la altura que le dé su contenedor en vez de la de su contenido (p. ej. la lista de niveles, que necesita aprovechar casi toda la pantalla). */
  fillHeight?: boolean
}

export function XPWindow({
  title,
  counter,
  closeLabel,
  onClose,
  consentText,
  children,
  boardBelowFrame,
  footer,
  cornerAccessory,
  scrollableContent,
  fillHeight,
}: XPWindowProps) {
  const windowClasses = [
    styles['xp-window'],
    fillHeight && styles['xp-window--fill-height'],
    boardBelowFrame && styles['xp-window--has-board'],
  ]
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

        {boardBelowFrame && (
          <div className={styles['xp-window__board']}>{boardBelowFrame}</div>
        )}

        {footer && <div className={styles['xp-window__footer']}>{footer}</div>}
      </div>
    </div>
  )
}
