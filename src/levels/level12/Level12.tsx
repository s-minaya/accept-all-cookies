import { useCallback, useMemo, useRef, useState } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useT } from '../../i18n/useT'
import { useLevelBoard, useLevelFooter } from '../hostChannel'
import type { LevelProps } from '../types'
import { clickAcceptAll, createAcceptAllState, createSwitchAt, type Phase } from './acceptAll'
import { ProgressBar } from './ProgressBar'
import styles from './Level12.module.scss'

/**
 * Nivel 12 — Accept All (GDD Nivel 12, jefe final, 016-plan.md): texto en el
 * marco azul; la barra se publica vía `useLevelBoard` (`ProgressBar.tsx`,
 * dueña del reloj real); el pie vía `useLevelFooter` tiene el Disagree fijo
 * de siempre y el botón protagonista, cuya variante y texto derivan de
 * `phase` — sin `transition` de color, el GDD pide un cambio instantáneo
 * ("sin animación ni aviso") que la ráfaga de clics en piloto automático no
 * llegue a notar.
 *
 * `modelRef` es el único estado real del nivel (mutable, fuera de React): el
 * pie lo actualiza al pulsar, `ProgressBar` lo hace avanzar con el tiempo.
 * `phase` es solo el espejo en React que necesita el pie para re-renderizar
 * el botón — nunca se toca directamente, siempre a través de la ref.
 */
export default function Level12({ onWin, onLose, paused }: LevelProps) {
  const t = useT()
  const [switchAt] = useState(() => createSwitchAt(Math.floor(Math.random() * 0xffffffff)))
  const modelRef = useRef(createAcceptAllState(switchAt))
  // Compartida con `ProgressBar` (que la monta de verdad): el pie escribe
  // aquí también al pulsar, para que el relleno reaccione al instante en vez
  // de esperar al siguiente fotograma del reloj.
  const fillRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('agree')
  const [winning, setWinning] = useState(false)

  const handleProtagonistClick = useCallback(() => {
    if (paused || winning) return
    const { state, outcome } = clickAcceptAll(modelRef.current)
    modelRef.current = state
    fillRef.current?.style.setProperty('--progress', String(state.progress))
    if (state.phase !== phase) setPhase(state.phase)
    if (outcome === 'lose') onLose('failed')
    else if (outcome === 'win') setWinning(true)
  }, [paused, winning, phase, onLose])

  const board = useMemo(
    () => (
      <ProgressBar
        modelRef={modelRef}
        fillRef={fillRef}
        paused={paused}
        winning={winning}
        onWin={onWin}
        onPhaseChange={setPhase}
      />
    ),
    [paused, winning, onWin],
  )
  useLevelBoard(board)

  const footer = useMemo(
    () => (
      <div className={styles['level-12__buttons']}>
        <XPButton variant="disagree" onClick={() => onLose('failed')} disabled={paused || winning}>
          {t('game.disagree')}
        </XPButton>
        <XPButton
          variant={phase === 'trap' ? 'disagree' : 'agree'}
          onClick={handleProtagonistClick}
          disabled={paused || winning}
        >
          {t(phase === 'trap' ? 'game.disagree' : 'game.agree')}
        </XPButton>
      </div>
    ),
    [phase, paused, winning, handleProtagonistClick, onLose, t],
  )
  useLevelFooter(footer)

  return (
    <div className={styles['level-12']}>
      <p className={styles['level-12__text']}>{t('levels.12.consent')}</p>
    </div>
  )
}
