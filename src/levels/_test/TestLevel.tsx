import { useRef } from 'react'
import { XPButton } from '../../components/xp/XPButton'
import { useCountdown } from '../../hooks/useCountdown'
import { usePointer } from '../../hooks/usePointer'
import type { LevelProps } from '../types'
import styles from './TestLevel.module.css'

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
    <div className={styles.container}>
      <div ref={pointerBoxRef} className={styles.pointerBox}>
        <span>{isPressed ? 'pressed' : 'hover me'}</span>
        <span className={styles.tick}>{remaining}</span>
      </div>

      <div className={styles.actions}>
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
