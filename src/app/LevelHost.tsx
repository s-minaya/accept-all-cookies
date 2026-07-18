import { Suspense, useEffect } from 'react'
import { XPWindow } from '../components/xp/XPWindow'
import { useCountdown } from '../hooks/useCountdown'
import { useT } from '../i18n/useT'
import { LEVEL_DURATION_SECONDS, type LevelDefinition, type LoseReason } from '../levels/types'

export type LevelExitResult = { outcome: 'win' } | { outcome: 'lose'; reason: LoseReason }

export interface LevelHostProps {
  level: LevelDefinition
  /** Resume value for the countdown (e.g. after a reload); defaults to a fresh 100s. */
  initialSeconds?: number
  /** Called on every countdown tick, so the shell can persist the time left. */
  onTick?: (secondsLeft: number) => void
  onExit: (result: LevelExitResult) => void
}

/**
 * Owns everything the level contract says a level must never touch: the
 * countdown, the X (close) button, and lazy-loading the level's chunk. The
 * level only ever sees `onWin` / `onLose` / `timeLeft`.
 */
export function LevelHost({
  level,
  initialSeconds = LEVEL_DURATION_SECONDS,
  onTick,
  onExit,
}: LevelHostProps) {
  const t = useT()
  const { remaining } = useCountdown(initialSeconds, {
    onComplete: () => onExit({ outcome: 'lose', reason: 'timeout' }),
  })

  useEffect(() => {
    onTick?.(remaining)
  }, [remaining, onTick])

  const LevelComponent = level.component

  return (
    <XPWindow
      title={t(level.titleKey)}
      counter={remaining}
      closeLabel={t('shell.level.close')}
      onClose={() => onExit({ outcome: 'lose', reason: 'closed' })}
      consentText={t(level.consentKey)}
    >
      <Suspense fallback={<span>{t('shell.level.loading')}</span>}>
        <LevelComponent
          timeLeft={remaining}
          onWin={() => onExit({ outcome: 'win' })}
          onLose={(reason) => onExit({ outcome: 'lose', reason })}
        />
      </Suspense>
    </XPWindow>
  )
}
