import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from '../../i18n/useT'
import { usePointer } from '../../hooks/usePointer'
import type { Point } from '../../hooks/pointerLogic'
import { XPButton } from '../../components/xp/XPButton'
import type { LoseReason } from '../types'
import { createRng } from '../../utils/prng'
import { createEmptyCell, freeze, unfreeze, type CellState } from './cell'
import { CELL_COUNT, runCycle } from './cycle'
import { createGridClock, type GridClock } from './clock'
import styles from './Level09.module.scss'

/** Tiempo de inmovilidad para congelar (GDD §14, "~1 s"). */
const STILLNESS_MS = 1000
/** Duración de un ciclo (GDD §14) — cada cuánto se limpia el lote visible y aparece uno nuevo, parámetro ajustable en el checkpoint. */
const CYCLE_MS = 450

function createInitialCells(): CellState[] {
  return Array.from({ length: CELL_COUNT }, createEmptyCell)
}

export interface Level09GridProps {
  onWin: () => void
  onLose: (reason: LoseReason) => void
  paused: boolean
}

/**
 * La cuadrícula de 12 casillas, en un componente propio — no inline en
 * `Level09.tsx` (AGENTS.md: `useLevelBoard` la monta un ciclo de render
 * después que el propio nivel; el componente que mide/posiciona tiene que
 * ser el que se monta, lección de la 010/011/012).
 *
 * Corregido tras revisión de Sofía sobre la primera versión (013-plan.md,
 * nota al principio): las 12 casillas NO suben/bajan de forma continua e
 * independiente — el grid entero avanza por CICLOS sincronizados
 * (`cycle.ts`, `runCycle`): cada `CYCLE_MS` se limpia de golpe todo lo
 * visible y aparece un lote nuevo de varias casillas a la vez, con al menos
 * un Agree garantizado en el lote. Como los ciclos son eventos discretos
 * (~2/s, no 60/s), el estado de las 12 casillas vive en React normal
 * (`cells`) — a diferencia del nivel 8, aquí no hace falta ningún escritor
 * imperativo por fotograma.
 */
export function Level09Grid({ onWin, onLose, paused }: Level09GridProps) {
  const t = useT()
  const [rng] = useState(() => createRng(Math.floor(Math.random() * 0xffffffff)))
  const [cells, setCells] = useState<CellState[]>(createInitialCells)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const cellWrapperRefs = useRef<(HTMLDivElement | null)[]>(Array(CELL_COUNT).fill(null))
  const frozenIndexRef = useRef<number | null>(null)
  const gridClockRef = useRef<GridClock | null>(null)
  const elapsedSinceCycleRef = useRef(0)

  useEffect(() => {
    gridClockRef.current = createGridClock({
      onTick: (deltaMs) => {
        elapsedSinceCycleRef.current += deltaMs
        if (elapsedSinceCycleRef.current < CYCLE_MS) return
        elapsedSinceCycleRef.current -= CYCLE_MS
        setCells((prev) => runCycle(prev, rng))
      },
    })
    return () => {
      gridClockRef.current?.destroy()
      gridClockRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `rng` es estable por diseño (useState perezoso); el reloj se crea una sola vez, al montar.
  }, [])

  useEffect(() => {
    gridClockRef.current?.setPaused(paused)
  }, [paused])

  function hitTestCell(point: Point): number | null {
    const container = containerRef.current
    if (!container) return null
    const containerRect = container.getBoundingClientRect()
    for (let i = 0; i < CELL_COUNT; i++) {
      const el = cellWrapperRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      const left = rect.left - containerRect.left
      const top = rect.top - containerRect.top
      if (
        point.x >= left &&
        point.x <= left + rect.width &&
        point.y >= top &&
        point.y <= top + rect.height
      ) {
        return i
      }
    }
    return null
  }

  const handleStill = useCallback(
    (point: Point) => {
      if (paused || frozenIndexRef.current !== null) return
      const index = hitTestCell(point)
      if (index === null) return
      frozenIndexRef.current = index
      setCells((prev) => prev.map((cell, i) => (i === index ? freeze(cell) : cell)))
    },
    [paused],
  )

  const handleUnstill = useCallback(() => {
    if (paused) return
    const index = frozenIndexRef.current
    if (index === null) return
    frozenIndexRef.current = null
    setCells((prev) => prev.map((cell, i) => (i === index ? unfreeze(cell) : cell)))
  }, [paused])

  usePointer(containerRef, {
    stillnessMs: STILLNESS_MS,
    onStill: handleStill,
    onUnstill: handleUnstill,
  })

  function handleCellClick(index: number) {
    if (paused) return
    const { type } = cells[index]
    if (type === 'agree') onWin()
    else if (type === 'disagree') onLose('failed')
  }

  return (
    <div ref={containerRef} className={styles['level-09-grid']}>
      {cells.map((cell, index) => {
        const { type } = cell
        const hasButton = type !== null
        return (
          <div
            key={index}
            ref={(el) => {
              cellWrapperRefs.current[index] = el
            }}
            className={styles['level-09-grid__cell']}
          >
            {hasButton && (
              <XPButton
                variant={type}
                className={styles['level-09-grid__button']}
                disabled={paused}
                onClick={() => handleCellClick(index)}
              >
                {t(type === 'agree' ? 'game.agree' : 'game.disagree')}
              </XPButton>
            )}
          </div>
        )
      })}
    </div>
  )
}
