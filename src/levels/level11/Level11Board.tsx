import { useCallback, useState } from 'react'
import sansUrl from '../../assets/images/characters/sans.png'
import { useT } from '../../i18n/useT'
import type { LoseReason } from '../types'
import { answer, SCRIPT, type Answer } from './conversation'
import { SpeechBubble } from './SpeechBubble'
import { useTypewriter } from './useTypewriter'
import styles from './Level11.module.scss'

export interface Level11BoardProps {
  onWin: () => void
  onLose: (reason: LoseReason) => void
  paused: boolean
}

/**
 * Sans + su bocadillo (GDD Nivel 11, 015-plan.md), en un componente propio
 * que posee su propio progreso de conversación (`stepIndex`) y el efecto de
 * escritura: así el nodo que `Level11.tsx` publica vía `useLevelBoard` no
 * cambia de identidad en cada letra escrita — se re-renderiza por su cuenta,
 * como `Level09Grid.tsx` con sus ciclos. A diferencia de ese componente (o
 * `Board.tsx`/010, `Level08Grid.tsx`/012), aquí no hace falta ningún ref ni
 * `useLayoutEffect`: el layout es CSS puro, así que el "un ciclo de render
 * después" de `useLevelBoard` (AGENTS.md) no llega a aplicar.
 */
export function Level11Board({ onWin, onLose, paused }: Level11BoardProps) {
  const t = useT()
  const [stepIndex, setStepIndex] = useState(0)
  const step = SCRIPT[stepIndex]
  const questionText = t(step.questionKey)
  const { visibleText, unlocked, skip } = useTypewriter(questionText, paused)

  const handleAnswer = useCallback(
    (given: Answer) => {
      if (paused) return
      const outcome = answer(stepIndex, given)
      if (outcome === 'lose') onLose('failed')
      else if (outcome === 'win') onWin()
      else setStepIndex((prev) => prev + 1)
    },
    [paused, stepIndex, onLose, onWin],
  )

  const handleSkip = useCallback(() => {
    if (paused) return
    skip()
  }, [paused, skip])

  return (
    <div className={styles['level-11__board']}>
      <SpeechBubble
        visibleText={visibleText}
        disabled={!unlocked || paused}
        onAnswer={handleAnswer}
        onSkip={handleSkip}
      />
      <img src={sansUrl} alt="" className={styles['level-11__sans']} />
    </div>
  )
}
