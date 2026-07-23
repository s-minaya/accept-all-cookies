import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { useRunStore } from '../state/runStore'
import { useRankingStore } from '../state/rankingStore'
import { audioManager } from '../audio/AudioManager'

/** Simula el final de la animación CSS de GiantVerdict (jsdom nunca la ejecuta de verdad). */
function resolveGiantVerdict(container: HTMLElement) {
  const verdictText = container.querySelector('[class*="giant-verdict__text"]')
  if (!verdictText) throw new Error('GiantVerdict text not found — ¿el veredicto no se disparó?')
  fireEvent.animationEnd(verdictText)
}

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: null })
    useRankingStore.setState({ entries: [] })
  })

  it('navigates landing -> select -> level -> win (verdict + modal) -> select, one screen mounted at a time', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppShell />)

    expect(screen.getByText('Empezar')).toBeInTheDocument()
    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()

    await user.click(screen.getByText('Empezar'))
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Empezar')).not.toBeInTheDocument()

    await user.click(screen.getByText('Check'))
    const agreeButton = await screen.findByText('Agree')
    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()

    await user.click(agreeButton)
    resolveGiantVerdict(container)
    await user.click(await screen.findByText('Next'))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Cookies Accepted')).not.toBeInTheDocument()
    expect(useRunStore.getState().completedLevels).toEqual([1])
    expect(useRunStore.getState().activeLevelTimeLeft).toBeNull()
  })

  it('losing (Disagree) resets the run and returns to select', async () => {
    const user = userEvent.setup()
    useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
    const { container } = render(<AppShell />)

    await user.click(screen.getByText('Check'))
    const disagreeButton = await screen.findByText('Disagree')
    await user.click(disagreeButton)
    resolveGiantVerdict(container)
    await user.click(await screen.findByText('Return to Level Selection'))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    // El récord ya quedó fijado en 2 al abrir el nivel (recordIfImproved); perder
    // reinicia el run pero no debe tocar el ranking por sí mismo.
    expect(useRankingStore.getState().entries).toEqual([expect.objectContaining({ maxLevel: 2 })])
  })

  it('closing the level with X counts as a loss and resets the run', async () => {
    const user = userEvent.setup()
    useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
    const { container } = render(<AppShell />)

    await user.click(screen.getByText('Check'))
    await screen.findByText('Agree')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    resolveGiantVerdict(container)
    await user.click(await screen.findByText('Return to Level Selection'))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
  })

  describe('resuming after a reload (progress persisted in runStore)', () => {
    it('boots straight into the level, with the countdown resumed, if one was in progress', () => {
      useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: 55 })
      render(<AppShell />)

      expect(screen.getByText('Agree')).toBeInTheDocument()
      expect(screen.getByText('55')).toBeInTheDocument()
      expect(screen.queryByText('Empezar')).not.toBeInTheDocument()
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
    })

    it('boots into select (not landing) if there is progress but no active level', () => {
      useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
      render(<AppShell />)

      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
      expect(screen.queryByText('Empezar')).not.toBeInTheDocument()
    })

    it('boots into landing when there is no progress at all', () => {
      render(<AppShell />)
      expect(screen.getByText('Empezar')).toBeInTheDocument()
    })
  })

  describe('win/lose sound effects (disparados por GiantVerdict al montarse)', () => {
    it('plays the positive sound on win', async () => {
      const playPositive = vi.spyOn(audioManager, 'playPositive')
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Agree'))

      expect(playPositive).toHaveBeenCalled()
    })

    it('plays the negative sound on loss (wrong button, timeout, or closing with X)', async () => {
      const playNegative = vi.spyOn(audioManager, 'playNegative')
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Disagree'))

      expect(playNegative).toHaveBeenCalled()
    })
  })

  describe('récord del ranking (004)', () => {
    it('records the level being opened as the ranking record', async () => {
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await screen.findByText('Agree')

      expect(useRankingStore.getState().entries).toEqual([expect.objectContaining({ maxLevel: 1 })])
    })

    it('marks the run as finished after winning level 12', async () => {
      const user = userEvent.setup()
      useRunStore.setState({
        completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        currentLevel: 12,
        activeLevelTimeLeft: null,
      })
      const { container } = render(<AppShell />)

      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Agree'))
      resolveGiantVerdict(container)
      await user.click(await screen.findByText('Next'))

      expect(useRankingStore.getState().entries).toEqual([
        expect.objectContaining({ maxLevel: 12, finished: true }),
      ])
    })
  })

  it('plays a full run, winning all 12 levels in order, ending with Check disabled', async () => {
    const user = userEvent.setup()
    const { container } = render(<AppShell />)

    await user.click(screen.getByText('Empezar'))

    for (let level = 1; level <= 12; level++) {
      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Agree'))
      resolveGiantVerdict(container)
      await user.click(await screen.findByText('Next'))
      await screen.findByText('Cookie Preferences')
    }

    expect(useRunStore.getState().completedLevels).toHaveLength(12)
    expect(useRankingStore.getState().entries).toEqual([
      expect.objectContaining({ maxLevel: 12, finished: true }),
    ])
    // Con los 12 completados no queda ningún nivel "disponible", así que no
    // se renderiza ningún botón Check (en vez de uno deshabilitado).
    expect(screen.queryByText('Check')).not.toBeInTheDocument()
  })
})
