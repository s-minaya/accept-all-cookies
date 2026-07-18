import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { useRunStore } from '../state/runStore'
import { useRankingStore } from '../state/rankingStore'
import { audioManager } from '../audio/AudioManager'

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: null })
    useRankingStore.setState({ entries: [] })
  })

  it('navigates landing -> select -> level -> win -> select, one screen mounted at a time', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    expect(screen.getByText('Accept All Cookies')).toBeInTheDocument()
    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()

    await user.click(screen.getByText('Empezar'))
    expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Accept All Cookies')).not.toBeInTheDocument()

    await user.click(screen.getByText('Check'))
    const agreeButton = await screen.findByText('Agree')
    expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()

    await user.click(agreeButton)
    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Agree')).not.toBeInTheDocument()
    expect(useRunStore.getState().completedLevels).toEqual([1])
    expect(useRunStore.getState().activeLevelTimeLeft).toBeNull()
  })

  it('losing (Disagree) resets the run and returns to select', async () => {
    const user = userEvent.setup()
    useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
    render(<AppShell />)

    await user.click(screen.getByText('Check'))
    const disagreeButton = await screen.findByText('Disagree')
    await user.click(disagreeButton)

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
  })

  it('closing the level with X counts as a loss and resets the run', async () => {
    const user = userEvent.setup()
    useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
    render(<AppShell />)

    await user.click(screen.getByText('Check'))
    await screen.findByText('Agree')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
  })

  it('reaches credits from the landing and can come back', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByText('Créditos'))
    expect(screen.getByText('Créditos completos próximamente.')).toBeInTheDocument()
    expect(screen.queryByText('Accept All Cookies')).not.toBeInTheDocument()

    await user.click(screen.getByText('Volver al inicio'))
    expect(screen.getByText('Accept All Cookies')).toBeInTheDocument()
  })

  describe('resuming after a reload (progress persisted in runStore)', () => {
    it('boots straight into the level, with the countdown resumed, if one was in progress', () => {
      useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: 55 })
      render(<AppShell />)

      expect(screen.getByText('Agree')).toBeInTheDocument()
      expect(screen.getByText('55')).toBeInTheDocument()
      expect(screen.queryByText('Accept All Cookies')).not.toBeInTheDocument()
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
    })

    it('boots into select (not landing) if there is progress but no active level', () => {
      useRunStore.setState({ completedLevels: [1], currentLevel: 2, activeLevelTimeLeft: null })
      render(<AppShell />)

      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument()
      expect(screen.queryByText('Accept All Cookies')).not.toBeInTheDocument()
    })

    it('boots into landing when there is no progress at all', () => {
      render(<AppShell />)
      expect(screen.getByText('Accept All Cookies')).toBeInTheDocument()
    })
  })

  describe('win/lose sound effects', () => {
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
})
