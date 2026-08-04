import { useState } from 'react'
import { XPButton } from '../components/xp/XPButton'
import { LevelHost, type LevelExitResult } from '../app/LevelHost'
import { testLevelDefinition } from '../levels/_test'
import styles from './Playground.module.scss'

function describeExit(result: LevelExitResult): string {
  switch (result.outcome) {
    case 'win':
      return 'win'
    case 'lose':
      return `lose (${result.reason})`
    case 'error':
      return 'error (chunk load failure)'
  }
}

/**
 * Arnés del contrato `LevelComponent` (feature 017, bloque A): con los 12
 * niveles reales ya construidos, `registry.ts` no necesita el nivel de
 * prueba como relleno — su único sitio en producción era ese, así que sale
 * del bundle por completo (`?playground` está gateado por
 * `import.meta.env.DEV`, `App.tsx`). Se queda accesible solo aquí, para
 * poder comprobar visualmente `onWin`/`onLose`/`onRestart`/el contador antes
 * de construir un nivel nuevo, sin tener que enchufarlo al registro real.
 */
export function LevelHostDemo() {
  const [key, setKey] = useState(0)
  const [lastExit, setLastExit] = useState<string | null>(null)

  return (
    <div>
      <div className={styles['playground__row']}>
        <span>
          Último desenlace: <strong>{lastExit ?? '—'}</strong>
        </span>
        <XPButton variant="neutral" onClick={() => setKey((k) => k + 1)}>
          Remount
        </XPButton>
      </div>
      <div className={styles['playground__level-host-frame']}>
        <LevelHost
          key={key}
          level={testLevelDefinition}
          isFinalLevel={false}
          onExit={(result) => setLastExit(describeExit(result))}
        />
      </div>
    </div>
  )
}
