import { useState } from 'react'
import { LevelHost, type LevelExitResult } from './LevelHost'
import { LandingScreen } from './screens/LandingScreen'
import { SelectScreen } from './screens/SelectScreen'
import { CreditsScreen } from './screens/CreditsScreen'
import { useAudio } from '../audio/useAudio'
import { useRunStore } from '../state/runStore'
import { levelRegistry } from '../levels/registry'
import { testLevelDefinition } from '../levels/_test'
import { LEVEL_DURATION_SECONDS } from '../levels/types'

type Screen = 'landing' | 'select' | 'level' | 'credits'

function initialScreen(): Screen {
  const { activeLevelTimeLeft, completedLevels } = useRunStore.getState()
  if (activeLevelTimeLeft !== null) return 'level'
  if (completedLevels.length > 0) return 'select'
  return 'landing'
}

/**
 * Enrutador de pantallas de todo el juego, por estado interno — nunca por
 * la URL (AGENTS.md: sin rutas de servidor en GitHub Pages, sin saltarse
 * niveles por URL). Monta exactamente una pantalla a la vez.
 *
 * La pantalla inicial se deriva de `runStore` (persistido) para que
 * recargar la página retome la partida donde estaba en vez de volver a la
 * landing — ver 002-plan.md "Decisiones".
 */
export function AppShell() {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const currentLevel = useRunStore((state) => state.currentLevel)
  const activeLevelTimeLeft = useRunStore((state) => state.activeLevelTimeLeft)
  const completeLevel = useRunStore((state) => state.completeLevel)
  const resetRun = useRunStore((state) => state.resetRun)
  const enterLevel = useRunStore((state) => state.enterLevel)
  const updateActiveLevelTime = useRunStore((state) => state.updateActiveLevelTime)
  const { playPositive, playNegative } = useAudio()

  const handleLevelExit = (result: LevelExitResult) => {
    if (result.outcome === 'win') {
      playPositive()
      completeLevel(currentLevel)
    } else {
      playNegative()
      resetRun()
    }
    setScreen('select')
  }

  switch (screen) {
    case 'landing':
      // Sin acceso a créditos desde aquí a propósito (GDD §1.1 / 003-spec.md):
      // el camino real es la pantalla de Level Complete del Nivel 12
      // (feature 016). `credits` se queda como Screen/case válido para esa
      // conexión futura.
      return <LandingScreen onStart={() => setScreen('select')} />

    case 'select':
      return (
        <SelectScreen
          currentLevel={currentLevel}
          onCheck={() => {
            enterLevel()
            setScreen('level')
          }}
          onBack={() => setScreen('landing')}
        />
      )

    case 'level':
      // Los niveles 1-12 vienen del registro real en cuanto las features
      // 005-016 lo completen; hasta entonces, el nivel de prueba ocupa su
      // lugar (ver 002-plan.md "Decisiones").
      return (
        <LevelHost
          level={levelRegistry[currentLevel] ?? testLevelDefinition}
          initialSeconds={activeLevelTimeLeft ?? LEVEL_DURATION_SECONDS}
          onTick={updateActiveLevelTime}
          onExit={handleLevelExit}
        />
      )

    case 'credits':
      return <CreditsScreen onBack={() => setScreen('landing')} />
  }
}
