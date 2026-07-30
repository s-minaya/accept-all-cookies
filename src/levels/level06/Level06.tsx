import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../../i18n/useT'
import { useAudio } from '../../audio/useAudio'
import { XPButton } from '../../components/xp/XPButton'
import { useLevelBoard, useLevelFooter } from '../hostChannel'
import type { LevelProps } from '../types'
import tablero from '../../data/nivel6-tablero.json'
import { findCell, simulate, type Cell, type Direction } from './boardLogic'
import { createPathAnimator, type PathAnimator } from './pathAnimator'
import { Board, type BoardStepApi } from './Board'
import styles from './Level06.module.scss'

/** Velocidad de cadena (GDD §14) — misma para avances, rebotes y castigos (010-plan.md, "Decisiones"). */
const CHAIN_SPEED_CELLS_PER_SEC = 10

const grid = tablero.grid
const foundStart = findCell(grid, 'K')
const foundLock = findCell(grid, 'L')
if (!foundStart || !foundLock) {
  // No debería ocurrir nunca: el validador (`nivel6-tablero.test.ts`) exige
  // exactamente una K y una L antes de que este JSON pueda considerarse
  // válido — si esto salta, el propio dato está corrupto.
  throw new Error('nivel6-tablero.json no tiene K o L — el tablero no pasa el validador.')
}
const startCell: Cell = foundStart
const lockCell: Cell = foundLock

/**
 * Nivel 6 — Cross-Site Tracking (GDD Nivel 6, 010-plan.md): el texto de
 * consentimiento vive en el marco azul (mismo patrón as-built que los
 * niveles 3-5), el tablero (grid + panel de dirección) se publica aparte
 * vía `useLevelBoard`, sin marco propio. La lógica de movimiento es pura
 * (`boardLogic.ts`, misma semántica que `spec/tools/validate-level6.mjs`,
 * contrastada contra la tabla del grafo de decisiones) — este componente
 * solo traduce pulsaciones a llamadas a `simulate()` y reproduce el camino
 * resultante con `pathAnimator.ts`, nunca decide nada de física ni de
 * reglas por sí mismo.
 */
export default function Level06({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const { playPositive } = useAudio()

  const [lockOpen, setLockOpen] = useState(false)
  const [isChaining, setIsChaining] = useState(false)
  const keyPosRef = useRef<Cell>(startCell)
  const isChainingRef = useRef(false)
  const stepApiRef = useRef<BoardStepApi | null>(null)
  const animatorRef = useRef<PathAnimator | null>(null)

  const handleDirection = useCallback(
    (dir: Direction) => {
      if (paused || isChainingRef.current) return
      const result = simulate(grid, keyPosRef.current, dir)
      if (result.tipo === 'blocked') return

      isChainingRef.current = true
      setIsChaining(true)
      animatorRef.current?.destroy()
      animatorRef.current = createPathAnimator({
        camino: result.camino,
        cellsPerSecond: CHAIN_SPEED_CELLS_PER_SEC,
        onStep: (cell) => {
          stepApiRef.current?.moveKeyTo(cell)
        },
        onComplete: () => {
          const finalCell = result.camino[result.camino.length - 1]
          keyPosRef.current = finalCell
          isChainingRef.current = false
          setIsChaining(false)
          animatorRef.current = null
          if (result.tipo === 'lock') {
            setLockOpen(true)
            playPositive()
          }
        },
      })
    },
    [paused, playPositive],
  )

  // `paused` congela la cadena en curso sin perder el progreso (mismo
  // patrón que los niveles 3-5) — no reinicia el animador, solo pausa su
  // rAF interno.
  useEffect(() => {
    animatorRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    const keyToDirection: Record<string, Direction> = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
    }
    function handleKeyDown(event: KeyboardEvent) {
      const dir = keyToDirection[event.key]
      if (!dir) return
      event.preventDefault()
      handleDirection(dir)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDirection])

  useEffect(() => {
    return () => {
      animatorRef.current?.destroy()
      animatorRef.current = null
    }
  }, [])

  const footer = useMemo(
    () => (
      <>
        {/* Solo en móvil (Level06.module.scss): mientras el candado sigue
            cerrado, el Agree deshabilitado no sirve de nada ahí — ocupa su
            sitio un panel de dirección compacto (2×2, 44px, mínimo táctil
            del GDD) en vez del de 3 filas del tablero (que en móvil pasa a
            `display: none`, ver más abajo). En cuanto se abre el candado,
            este bloque deja de existir y el Agree (que en desktop/tablet
            siempre estuvo ahí, solo deshabilitado) ocupa su lugar — mismo
            patrón que el nivel 1, cuyo Agree tampoco existe en el DOM hasta
            que se cumple su condición. */}
        {!lockOpen && (
          <div className={styles['level-06-footer-directions']}>
            <XPButton
              variant="neutral"
              className={styles['level-06-footer-directions__button']}
              aria-label={t('levels.6.up')}
              disabled={paused || isChaining}
              onClick={() => handleDirection('UP')}
            >
              ↑
            </XPButton>
            <XPButton
              variant="neutral"
              className={styles['level-06-footer-directions__button']}
              aria-label={t('levels.6.down')}
              disabled={paused || isChaining}
              onClick={() => handleDirection('DOWN')}
            >
              ↓
            </XPButton>
            <XPButton
              variant="neutral"
              className={styles['level-06-footer-directions__button']}
              aria-label={t('levels.6.left')}
              disabled={paused || isChaining}
              onClick={() => handleDirection('LEFT')}
            >
              ←
            </XPButton>
            <XPButton
              variant="neutral"
              className={styles['level-06-footer-directions__button']}
              aria-label={t('levels.6.right')}
              disabled={paused || isChaining}
              onClick={() => handleDirection('RIGHT')}
            >
              →
            </XPButton>
          </div>
        )}
        <XPButton
          variant="agree"
          disabled={!lockOpen || paused}
          onClick={onWin}
          className={!lockOpen ? styles['level-06-footer__agree--pending'] : undefined}
        >
          {t('game.agree')}
        </XPButton>
        <XPButton variant="disagree" disabled={paused} onClick={() => onLose('failed')}>
          {t('game.disagree')}
        </XPButton>
      </>
    ),
    [lockOpen, paused, isChaining, handleDirection, onWin, onLose, t],
  )
  useLevelFooter(footer)

  const board = useMemo(
    () => (
      <div className={styles['level-06']}>
        <div className={styles['level-06__board']}>
          <Board
            grid={grid}
            startCell={startCell}
            lockCell={lockCell}
            lockOpen={lockOpen}
            stepApiRef={stepApiRef}
          />
        </div>
        <div className={styles['level-06__panel']}>
          <XPButton
            variant="neutral"
            className={[styles['level-06__direction'], styles['level-06__direction--up']].join(' ')}
            aria-label={t('levels.6.up')}
            disabled={paused || isChaining}
            onClick={() => handleDirection('UP')}
          >
            ↑
          </XPButton>
          <XPButton
            variant="neutral"
            className={[styles['level-06__direction'], styles['level-06__direction--left']].join(
              ' ',
            )}
            aria-label={t('levels.6.left')}
            disabled={paused || isChaining}
            onClick={() => handleDirection('LEFT')}
          >
            ←
          </XPButton>
          <XPButton
            variant="neutral"
            className={[styles['level-06__direction'], styles['level-06__direction--right']].join(
              ' ',
            )}
            aria-label={t('levels.6.right')}
            disabled={paused || isChaining}
            onClick={() => handleDirection('RIGHT')}
          >
            →
          </XPButton>
          <XPButton
            variant="neutral"
            className={[styles['level-06__direction'], styles['level-06__direction--down']].join(
              ' ',
            )}
            aria-label={t('levels.6.down')}
            disabled={paused || isChaining}
            onClick={() => handleDirection('DOWN')}
          >
            ↓
          </XPButton>
        </div>
      </div>
    ),
    [lockOpen, paused, isChaining, handleDirection, t],
  )
  useLevelBoard(board)

  return (
    <div className={styles['level-06-consent']}>
      <p className={styles['level-06-consent__text']}>{t('levels.6.consent')}</p>
    </div>
  )
}
