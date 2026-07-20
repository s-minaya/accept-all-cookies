import { useRef } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useCountdown } from '../../hooks/useCountdown'
import { usePointer } from '../../hooks/usePointer'
import type { LevelProps } from '../types'
import styles from './TestLevel.module.scss'

/**
 * Trivial level used only to exercise the LevelComponent contract end to
 * end (win/lose/timeout, lazy chunk, cleanup on unmount). Not one of the
 * 12 real levels: never added to `levels/registry.ts` (AGENTS.md).
 *
 * Runs its own countdown and pointer listener — independent from
 * LevelHost's — so the "no leaked timers/listeners on unmount" test has
 * something real to check beyond LevelHost's own cleanup.
 */
export default function TestLevel({ onWin, onLose }: LevelProps) {
  const pointerBoxRef = useRef<HTMLDivElement>(null)
  const { remaining } = useCountdown(30)
  const { isPressed } = usePointer(pointerBoxRef)

  return (
    <div className={styles['test-level']}>
      <div ref={pointerBoxRef} className={styles['test-level__pointer-box']}>
        <span>{isPressed ? 'pressed' : 'hover me'}</span>
        <span className={styles['test-level__tick']}>{remaining}</span>
      </div>

      <div className={styles['test-level__actions']}>
        <XPButton variant="agree" onClick={onWin}>
          Agree
        </XPButton>
        <XPButton variant="disagree" onClick={() => onLose('failed')}>
          Disagree
        </XPButton>
      </div>
    </div>
  )
}
