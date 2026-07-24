import { useState } from 'react'
import { LevelHost, type LevelExitResult } from './LevelHost'
import { LandingScreen } from './screens/LandingScreen'
import { LevelSelectScreen } from './screens/LevelSelectScreen/LevelSelectScreen'
import { CreditsScreen } from './screens/CreditsScreen'
import { useAudio } from '../audio/useAudio'
import { useRunStore } from '../state/runStore'
import { useRankingStore } from '../state/rankingStore'
import { usePlayerStore } from '../state/playerStore'
import { resolvePlayerName } from './characters'
import { levelRegistry } from '../levels/registry'
import { LEVEL_DURATION_SECONDS, type LevelId } from '../levels/types'

type Screen = 'landing' | 'select' | 'level' | 'credits'

const FINAL_LEVEL: LevelId = 12

function initialScreen(): Screen {
  const { activeLevelTimeLeft, pendingOutcome, completedLevels } = useRunStore.getState()
  if (activeLevelTimeLeft !== null || pendingOutcome !== null) return 'level'
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
  const completedLevels = useRunStore((state) => state.completedLevels)
  const activeLevelTimeLeft = useRunStore((state) => state.activeLevelTimeLeft)
  const pendingOutcome = useRunStore((state) => state.pendingOutcome)
  const completeLevel = useRunStore((state) => state.completeLevel)
  const resetRun = useRunStore((state) => state.resetRun)
  const enterLevel = useRunStore((state) => state.enterLevel)
  const updateActiveLevelTime = useRunStore((state) => state.updateActiveLevelTime)
  const setPendingOutcome = useRunStore((state) => state.setPendingOutcome)
  const recordIfImproved = useRankingStore((state) => state.recordIfImproved)
  const markFinished = useRankingStore((state) => state.markFinished)
  const character = usePlayerStore((state) => state.character)
  const username = usePlayerStore((state) => state.username)
  // Mantiene AudioManager sincronizado con settingsStore y el desbloqueo de
  // autoplay activos en todas las pantallas, no solo mientras hay un nivel
  // montado (GiantVerdict dispara los sonidos de victoria/derrota por sí solo).
  useAudio()

  const handleCheck = () => {
    recordIfImproved({
      username: resolvePlayerName(character, username),
      character,
      maxLevel: currentLevel,
    })
    enterLevel()
    setScreen('level')
  }

  const handleLevelExit = (result: LevelExitResult) => {
    if (result.outcome === 'win') {
      completeLevel(currentLevel)
      if (currentLevel === FINAL_LEVEL) {
        markFinished({ username: resolvePlayerName(character, username), character })
      }
    } else {
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
        <LevelSelectScreen
          completedLevels={completedLevels}
          currentLevel={currentLevel}
          onCheck={handleCheck}
          onBack={() => setScreen('landing')}
        />
      )

    case 'level':
      return (
        <LevelHost
          level={levelRegistry[currentLevel]}
          isFinalLevel={currentLevel === FINAL_LEVEL}
          initialSeconds={activeLevelTimeLeft ?? LEVEL_DURATION_SECONDS}
          initialOutcome={pendingOutcome ?? undefined}
          onTick={updateActiveLevelTime}
          onOutcome={setPendingOutcome}
          onExit={handleLevelExit}
        />
      )

    case 'credits':
      return <CreditsScreen onBack={() => setScreen('landing')} />
  }
}
