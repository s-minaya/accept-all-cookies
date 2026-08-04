import { useCallback, useMemo, useRef, useState } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { useLevelFooter } from '../hostChannel'
import type { LevelProps } from '../types'
import { clampCoverOffset } from './coverLogic'
import styles from './Level07.module.scss'

/**
 * Nivel 7 — Data Sharing (GDD Nivel 7, 011-plan.md: la cubierta debe
 * arrastrarse DENTRO del espacio del mismo botón, no debe salirse hacia la
 * ventana): a la vista, dos Disagree rojos. El de la
 * derecha es una cubierta que tapa un Agree fijo, idéntico en tamaño (grid
 * con ambos en la misma celda: el texto más largo de "Disagree" decide el
 * tamaño, el Agree se estira a esa celda — nada de medir por JS). La
 * cubierta NUNCA sale de esa celda: se desplaza con un `transform`
 * imperativo (custom property `--cover-x/--cover-y`, sin re-render de React
 * por frame) limitado a ± su propio ancho/alto, y la celda recorta
 * (`overflow: hidden`) lo que se salga — el efecto es una cortina que se
 * corre dentro de su propio hueco, nunca un elemento libre por la ventana.
 * Recargar a mitad remonta el componente entero: la cubierta vuelve sola a
 * su posición de reposo, tapando el Agree — sin código de reinicio
 * dedicado.
 */
export default function Level07({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const stackRef = useRef<HTMLDivElement | null>(null)
  // Callback ref + `useState` (no un `useRef` normal): la cubierta la
  // publica `useLevelFooter` hacia un punto del árbol ajeno a este
  // componente (`LevelHost`/el harness de turno la monta un ciclo de
  // render DESPUÉS del propio de `Level07`, igual que el lienzo del nivel 4)
  // — con un `useRef` a secas, el efecto de `usePointer` (depende solo de
  // `[ref]`, que nunca cambia de identidad) se ejecutaría una única vez
  // contra un `.current` todavía `null` y no volvería a engancharse nunca.
  // `pointerTargetRef` crea un objeto NUEVO en cuanto el botón real existe,
  // forzando a `usePointer` a reengancharse sobre el nodo de verdad.
  const coverRef = useRef<HTMLButtonElement | null>(null)
  const [coverEl, setCoverEl] = useState<HTMLButtonElement | null>(null)
  const setCoverNode = useCallback((el: HTMLButtonElement | null) => {
    coverRef.current = el
    setCoverEl(el)
  }, [])
  const pointerTargetRef = useMemo(() => ({ current: coverEl }), [coverEl])
  const grabOffsetRef = useRef<Point>({ x: 0, y: 0 })
  // Una vez arrastrada (aunque sea una vez), la cubierta queda "desarmada"
  // para siempre: arrastrarla desactiva la derrota por tap, no solo
  // mientras está fuera de su sitio.
  const hasBeenDraggedRef = useRef(false)

  function applyOffset(point: Point) {
    coverRef.current?.style.setProperty('--cover-x', `${point.x}px`)
    coverRef.current?.style.setProperty('--cover-y', `${point.y}px`)
  }

  const handleDragStart = (point: Point) => {
    if (paused) return
    hasBeenDraggedRef.current = true
    // Punto dentro de la cubierta donde se agarró (todavía válido: no se ha
    // movido nada en lo que va de este gesto) — se mantiene bajo el
    // puntero durante todo el arrastre.
    grabOffsetRef.current = point
  }

  const handleDragMove = (point: Point) => {
    if (paused) return
    const cover = coverRef.current
    const stack = stackRef.current
    if (!cover || !stack) return
    const coverRect = cover.getBoundingClientRect()
    const stackRect = stack.getBoundingClientRect()

    // Reconstruye la posición del puntero en coordenadas de cliente a partir
    // del punto local que ya calculó `usePointer` (relativo al rect ACTUAL
    // de la cubierta, que ya se ha desplazado por `transform`) sumándole ese
    // mismo rect — evita depender de un delta acumulado frame a frame, que
    // con una cubierta que se traslada (a diferencia de la rotación del
    // nivel 3, cuyo centro no se mueve) arrastraría error de un fotograma a
    // otro. `stackRect` (no la ventana) es el marco de referencia estable:
    // la celda de reposo de la cubierta (sin transform) coincide con la
    // esquina superior izquierda de la pila, así que restar su posición da
    // directamente el desplazamiento deseado.
    const clientX = point.x + coverRect.left
    const clientY = point.y + coverRect.top
    const proposedX = clientX - stackRect.left - grabOffsetRef.current.x
    const proposedY = clientY - stackRect.top - grabOffsetRef.current.y

    const clamped = clampCoverOffset({
      x: proposedX,
      y: proposedY,
      maxOffsetX: stackRect.width,
      maxOffsetY: stackRect.height,
    })
    applyOffset(clamped)
  }

  const handleCoverTap = () => {
    // Arrastrar la cubierta la "desarma" de forma permanente — un tap sobre
    // ella solo pierde si TODAVÍA no se ha
    // arrastrado nunca (su estado inicial). Una vez movida, ya no es un
    // Disagree real: puede volver a taparlo todo sin que vuelva a ser
    // pulsable como derrota.
    if (paused || hasBeenDraggedRef.current) return
    onLose('failed')
  }

  usePointer(pointerTargetRef, {
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onTap: handleCoverTap,
  })

  const footer = useMemo(
    () => (
      <div className={styles['level-07-footer']}>
        <XPButton variant="disagree" onClick={() => onLose('failed')} disabled={paused}>
          {t('game.disagree')}
        </XPButton>
        <div ref={stackRef} className={styles['level-07-footer__stack']}>
          <XPButton
            variant="agree"
            className={styles['level-07-footer__agree-fixed']}
            onClick={onWin}
            disabled={paused}
          >
            {t('game.agree')}
          </XPButton>
          <XPButton
            ref={setCoverNode}
            variant="disagree"
            className={styles['level-07-footer__cover']}
          >
            {t('game.disagree')}
          </XPButton>
        </div>
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- los manejadores de arrastre leen refs/props frescos por closure (mismo patrón que el nivel 3); no son dependencias reales del nodo memoizado.
    [onWin, onLose, paused, t],
  )
  useLevelFooter(footer)

  return (
    <div className={styles['level-07']}>
      <p className={styles['level-07__text']}>{t('levels.7.consent')}</p>
    </div>
  )
}
