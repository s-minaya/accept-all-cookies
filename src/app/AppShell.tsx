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
 * Screen router for the whole game, by internal state — never the URL
 * (AGENTS.md: no server routes on GitHub Pages, no level-skipping via URL).
 * Renders exactly one screen at a time.
 *
 * The initial screen is derived from `runStore` (persisted) so a reload
 * resumes the run in place instead of bouncing back to the landing —
 * feedback from Sofía, see 002-plan.md "Decisiones".
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
      return (
        <LandingScreen onStart={() => setScreen('select')} onCredits={() => setScreen('credits')} />
      )

    case 'select':
      return (
        <SelectScreen
          currentLevel={currentLevel}
          onCheck={() => {
            enterLevel()
            setScreen('level')
          }}
        />
      )

    case 'level':
      // Levels 1-12 come from the real registry once features 005-016 populate it;
      // the test level fills in until then (see 002-plan.md "Decisiones").
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
