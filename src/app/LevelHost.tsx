import { Suspense, useEffect } from 'react'
import { XPWindow } from '../components/xp/XPWindow'
import { useCountdown } from '../hooks/useCountdown'
import { useT } from '../i18n/useT'
import { LEVEL_DURATION_SECONDS, type LevelDefinition, type LoseReason } from '../levels/types'

export type LevelExitResult = { outcome: 'win' } | { outcome: 'lose'; reason: LoseReason }

export interface LevelHostProps {
  level: LevelDefinition
  /** Valor de reanudación del contador (p. ej. tras una recarga); por defecto arranca en 100s. */
  initialSeconds?: number
  /** Se llama en cada tick del contador, para que el shell persista el tiempo restante. */
  onTick?: (secondsLeft: number) => void
  onExit: (result: LevelExitResult) => void
}

/**
 * Gestiona todo lo que el contrato de nivel dice que un nivel nunca debe
 * tocar: el contador, el botón X (cerrar) y la carga perezosa del chunk del
 * nivel. El nivel solo ve `onWin` / `onLose` / `timeLeft`.
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
