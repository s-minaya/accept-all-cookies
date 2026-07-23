import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { CharacterModal } from './CharacterModal'
import { usePlayerStore } from '../../../state/playerStore'
import { useRunStore } from '../../../state/runStore'
import { useSettingsStore } from '../../../state/settingsStore'

describe('CharacterModal — cambiar de jugador reinicia la partida en curso', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useSettingsStore.setState({ language: 'en' })
    usePlayerStore.setState({ character: 0, username: 'Crumbs' })
    useRunStore.setState({
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      currentLevel: 12,
      activeLevelTimeLeft: null,
    })
  })

  it('resets the run when confirming a different name for the same character', async () => {
    const user = userEvent.setup()
    render(<CharacterModal onClose={() => {}} />)

    const nameInput = screen.getByLabelText('Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nueva')
    await user.click(screen.getByText('Confirm'))

    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    expect(usePlayerStore.getState().username).toBe('Nueva')
  })

  it('resets the run when switching to a different character', async () => {
    const user = userEvent.setup()
    render(<CharacterModal onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: /Incognito/i }))
    await user.click(screen.getByText('Confirm'))

    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    expect(usePlayerStore.getState().character).toBe(1)
  })

  it('does not reset the run when confirming the exact same identity again', async () => {
    const user = userEvent.setup()
    render(<CharacterModal onClose={() => {}} />)

    await user.click(screen.getByText('Confirm'))

    expect(useRunStore.getState()).toMatchObject({
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      currentLevel: 12,
    })
  })
})
