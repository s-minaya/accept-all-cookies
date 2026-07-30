import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { cameraOffsetX } from './cameraLogic'
import type { Cell } from './boardLogic'
import styles from './Board.module.scss'

/** Grosor del anillo decorativo (GDD: "rodeado por casillas 1×1 grises"), en casillas, a cada lado. */
export const RING_SIZE = 1
/** Tamaño lógico de cada casilla — mantener en sincro con `Board.module.scss`. */
export const CELL_SIZE_PX = 32

export interface BoardStepApi {
  /** Mueve la llave (y la cámara, si hace falta) a `cell` — sin transición si `instant`, con la transición CSS habitual si no. */
  moveKeyTo: (cell: Cell, instant?: boolean) => void
}

export interface BoardProps {
  grid: readonly string[]
  /** Celda inicial/de reinicio — solo se usa para el primer pintado (`useLayoutEffect`, antes de que el navegador pinte nada). */
  startCell: Cell
  lockCell: Cell
  lockOpen: boolean
  /** El padre (`Level06.tsx`) llama a `stepApiRef.current.moveKeyTo(...)` desde `pathAnimator.ts` en cada paso — nunca por estado de React, para no re-renderizar las ~380 casillas en cada fotograma. */
  stepApiRef: MutableRefObject<BoardStepApi | null>
}

/**
 * Tablero del nivel 6 (GDD Nivel 6, 010-plan.md): grid fijo (nunca se
 * vuelve a renderizar tras el primer pintado — memoizado sin dependencias
 * que cambien) + ventana de cámara que recorta (`overflow: hidden`) una
 * tira mucho más ancha que la propia ventana. La llave y el desplazamiento
 * de la cámara se mueven escribiendo custom properties directamente en el
 * DOM (mismo patrón que los niveles 3-5), nunca por estado de React.
 */
export function Board({ grid, startCell, lockCell, lockOpen, stepApiRef }: BoardProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const keyRef = useRef<HTMLDivElement>(null)
  const viewportWidthRef = useRef(0)
  const currentCellRef = useRef<Cell>(startCell)

  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const totalCols = cols + RING_SIZE * 2
  const totalRows = rows + RING_SIZE * 2

  function applyPosition(cell: Cell, instant?: boolean) {
    currentCellRef.current = cell
    const keyEl = keyRef.current
    if (keyEl) {
      keyEl.style.setProperty('--key-row', String(cell.row + RING_SIZE))
      keyEl.style.setProperty('--key-col', String(cell.col + RING_SIZE))
      keyEl.classList.toggle(styles['board__key--instant'] ?? '', Boolean(instant))
    }
    const offset = cameraOffsetX({
      keyCol: cell.col + RING_SIZE,
      cellSizePx: CELL_SIZE_PX,
      viewportWidthPx: viewportWidthRef.current,
      totalCols,
    })
    const trackEl = trackRef.current
    if (trackEl) {
      trackEl.style.setProperty('--camera-offset', `${offset}px`)
      trackEl.classList.toggle(styles['board__track--instant'] ?? '', Boolean(instant))
    }
  }

  useLayoutEffect(() => {
    applyPosition(startCell, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe re-fijar la posición cuando cambia la celda de reinicio (recarga a mitad, GDD), no en cada render.
  }, [startCell])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      viewportWidthRef.current = entry.contentRect.width
      applyPosition(currentCellRef.current, true)
    })
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se registra una sola vez; `applyPosition` en sí no cambia de forma relevante entre renders.
  }, [])

  useEffect(() => {
    stepApiRef.current = { moveKeyTo: applyPosition }
    return () => {
      stepApiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cells = useMemo(() => {
    const nodes: ReactNode[] = []
    for (let row = -RING_SIZE; row < rows + RING_SIZE; row++) {
      for (let col = -RING_SIZE; col < cols + RING_SIZE; col++) {
        const isRing = row < 0 || row >= rows || col < 0 || col >= cols
        const symbol = isRing ? null : grid[row][col]
        const style = {
          '--cell-row': row + RING_SIZE,
          '--cell-col': col + RING_SIZE,
        } as CSSProperties
        if (isRing) {
          nodes.push(
            <div key={`${row},${col}`} className={styles['board__cell--ring']} style={style} />,
          )
          continue
        }
        if (symbol === '^' || symbol === 'v' || symbol === '<' || symbol === '>') {
          nodes.push(
            <div key={`${row},${col}`} className={styles['board__cell']} style={style}>
              <span className={styles['board__arrow']} aria-hidden="true">
                {symbol === '^' ? '↑' : symbol === 'v' ? '↓' : symbol === '<' ? '←' : '→'}
              </span>
            </div>,
          )
          continue
        }
        // '.', 'K' (la posición real de la llave la pinta el sprite aparte,
        // ver más abajo) y 'L' (idem, el candado se pinta aparte para poder
        // alternar abierto/cerrado sin tocar el grid memoizado) se quedan
        // como casilla vacía lisa.
        nodes.push(<div key={`${row},${col}`} className={styles['board__cell']} style={style} />)
      }
    }
    return nodes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el grid es un dato estático importado, nunca cambia en la vida del componente.
  }, [])

  return (
    <div ref={viewportRef} className={[styles['board'], styles['board__viewport']].join(' ')}>
      <div
        ref={trackRef}
        className={styles['board__track']}
        style={
          {
            '--total-cols': totalCols,
            '--total-rows': totalRows,
          } as CSSProperties
        }
      >
        {cells}
        <div
          className={[
            styles['board__cell'],
            styles['board__lock'],
            lockOpen ? styles['board__lock--open'] : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={
            {
              '--cell-row': lockCell.row + RING_SIZE,
              '--cell-col': lockCell.col + RING_SIZE,
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <span className={styles['board__lock-body']} />
          <span className={styles['board__lock-shackle']} />
        </div>
        <div ref={keyRef} className={styles['board__key']} aria-hidden="true">
          <span className={styles['board__key-head']} />
          <span className={styles['board__key-shaft']} />
        </div>
      </div>
    </div>
  )
}
