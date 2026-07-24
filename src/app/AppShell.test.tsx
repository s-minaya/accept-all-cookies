import { act, fireEvent, render, screen } from '@testing-library/react'
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
    useRunStore.setState({
      completedLevels: [],
      currentLevel: 1,
      activeLevelTimeLeft: null,
      pendingOutcome: null,
    })
    useRankingStore.setState({ entries: [] })
  })

  it('navigates landing -> select -> level -> win (verdict + modal) -> select, one screen mounted at a time', async () => {
    // Nivel 2 a propósito (nivel de prueba, sin el retardo de 7s del Agree
    // del nivel 1 real): este test verifica el flujo genérico del shell.
    useRunStore.setState({ completedLevels: [], currentLevel: 2, activeLevelTimeLeft: null })
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
    await user.click(await screen.findByText('Siguiente'))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(screen.queryByText('Cookies Accepted')).not.toBeInTheDocument()
    expect(useRunStore.getState().completedLevels).toEqual([2])
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
    await user.click(await screen.findByText('Volver a la selección de niveles'))

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
    await user.click(await screen.findByText('Volver a la selección de niveles'))

    expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
    expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
  })

  describe('resuming after a reload (progress persisted in runStore)', () => {
    it('boots straight into the level, with the countdown resumed, if one was in progress', async () => {
      // 55 restantes de 100 = 45s transcurridos, ya por encima del retardo
      // de 7s del Agree del nivel 1 real: debe verse desde el primer render.
      useRunStore.setState({ completedLevels: [], currentLevel: 1, activeLevelTimeLeft: 55 })
      render(<AppShell />)

      expect(await screen.findByText('Agree')).toBeInTheDocument()
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

    it('reloading with a pending win outcome shows the Level Complete modal directly, not the playable level', async () => {
      useRunStore.setState({
        completedLevels: [],
        currentLevel: 2,
        activeLevelTimeLeft: 40,
        pendingOutcome: 'win',
      })
      const user = userEvent.setup()
      render(<AppShell />)

      expect(await screen.findByText('Cookies Accepted')).toBeInTheDocument()
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
      expect(screen.queryByText('Empezar')).not.toBeInTheDocument()

      await user.click(screen.getByText('Siguiente'))

      expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
      expect(useRunStore.getState()).toMatchObject({ completedLevels: [2], pendingOutcome: null })
    })

    it('reloading with a pending lose outcome shows the Game Over modal directly, and its button resets the run', async () => {
      useRunStore.setState({
        completedLevels: [1],
        currentLevel: 2,
        activeLevelTimeLeft: 40,
        pendingOutcome: 'lose',
      })
      const user = userEvent.setup()
      render(<AppShell />)

      expect(await screen.findByText('Volver a la selección de niveles')).toBeInTheDocument()
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()

      await user.click(screen.getByText('Volver a la selección de niveles'))

      expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
      expect(useRunStore.getState()).toMatchObject({
        completedLevels: [],
        currentLevel: 1,
        pendingOutcome: null,
      })
    })

    it('the level 1 win-then-reload case that exposed the bug: no playable Agree, the modal shows instead', async () => {
      // 40s restantes de 100 = 60s transcurridos, muy por encima del retardo
      // de 7s del Agree del nivel 1 real: antes de este fix, esto hacía que
      // el Agree apareciera visible y pulsable desde el primer frame en vez
      // de mostrarse la modal de victoria.
      useRunStore.setState({
        completedLevels: [],
        currentLevel: 1,
        activeLevelTimeLeft: 40,
        pendingOutcome: 'win',
      })
      render(<AppShell />)

      expect(await screen.findByText('Cookies Accepted')).toBeInTheDocument()
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Agree' })).toBeDisabled()
    })
  })

  describe('win/lose sound effects (disparados por GiantVerdict al montarse)', () => {
    it('plays the positive sound on win', async () => {
      // Nivel 2 (nivel de prueba): Agree inmediato, sin el retardo de 7s del nivel 1 real.
      useRunStore.setState({ completedLevels: [], currentLevel: 2, activeLevelTimeLeft: null })
      const playPositive = vi.spyOn(audioManager, 'playPositive')
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Agree'))

      expect(playPositive).toHaveBeenCalled()
    })

    it('plays the negative sound on loss (wrong button, timeout, or closing with X)', async () => {
      // Nivel 2 (nivel de prueba): a diferencia del nivel 1 real, aquí Disagree sí es derrota.
      useRunStore.setState({ completedLevels: [], currentLevel: 2, activeLevelTimeLeft: null })
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
      // Disagree (no Agree): en el nivel 1 real, Agree tarda 7s en aparecer.
      await screen.findByText('Disagree')

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
      await user.click(await screen.findByText('Siguiente'))

      expect(useRankingStore.getState().entries).toEqual([
        expect.objectContaining({ maxLevel: 12, finished: true }),
      ])
    })
  })

  it('plays a full run, winning all 12 levels in order, ending with Check disabled', async () => {
    // Fake timers: el nivel 1 real tarda 7s (simulados) en mostrar Agree.
    vi.useFakeTimers()
    try {
      const { container } = render(<AppShell />)

      fireEvent.click(screen.getByText('Empezar'))

      for (let level = 1; level <= 12; level++) {
        fireEvent.click(screen.getByText('Check'))
        await vi.waitFor(() => expect(screen.getByText('Disagree')).toBeInTheDocument())

        // Inofensivo para los niveles 2-12 (nivel de prueba, Agree inmediato);
        // necesario para el nivel 1 real.
        act(() => {
          vi.advanceTimersByTime(7000)
        })

        fireEvent.click(await vi.waitFor(() => screen.getByText('Agree')))
        resolveGiantVerdict(container)
        fireEvent.click(await vi.waitFor(() => screen.getByText('Siguiente')))
        await vi.waitFor(() => expect(screen.getByText('Cookie Preferences')).toBeInTheDocument())
      }

      expect(useRunStore.getState().completedLevels).toHaveLength(12)
      expect(useRankingStore.getState().entries).toEqual([
        expect.objectContaining({ maxLevel: 12, finished: true }),
      ])
      // Con los 12 completados no queda ningún nivel "disponible", así que no
      // se renderiza ningún botón Check (en vez de uno deshabilitado).
      expect(screen.queryByText('Check')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  describe('Nivel 1 — Essential Cookies (005)', () => {
    it('wins through the standard flow once Agree appears, showing the Essential Cookies category', async () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<AppShell />)

        fireEvent.click(screen.getByText('Empezar'))
        fireEvent.click(screen.getByText('Check'))
        await vi.waitFor(() => expect(screen.getByText('Disagree')).toBeInTheDocument())
        expect(screen.queryByText('Agree')).not.toBeInTheDocument()

        act(() => {
          vi.advanceTimersByTime(7000)
        })

        fireEvent.click(await vi.waitFor(() => screen.getByText('Agree')))
        resolveGiantVerdict(container)
        await vi.waitFor(() => expect(screen.getByText('Cookies Accepted')).toBeInTheDocument())
        // La categoría aparece dos veces (título de la ventana detrás y
        // mensaje de la modal): basta con comprobar que aparece en algún sitio.
        expect(screen.getAllByText(/Cookies Esenciales/).length).toBeGreaterThan(0)

        fireEvent.click(screen.getByText('Siguiente'))
        await vi.waitFor(() => expect(screen.getByText('Cookie Preferences')).toBeInTheDocument())

        expect(useRunStore.getState().completedLevels).toEqual([1])
      } finally {
        vi.useRealTimers()
      }
    })

    it('Disagree opens an error dialog instead of losing, and OK restarts the level (not a Game Over)', async () => {
      const playNegative = vi.spyOn(audioManager, 'playNegative')
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await user.click(await screen.findByText('Disagree'))

      expect(await screen.findByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Las cookies esenciales no se pueden rechazar.')).toBeInTheDocument()
      expect(playNegative).not.toHaveBeenCalled()

      await user.click(screen.getByText('OK'))

      // Sigue en el nivel 1 (no hubo Game Over ni vuelta a la selección):
      // el diálogo de error se cierra y el Agree vuelve a estar oculto.
      expect(screen.queryByText('Cookie Preferences')).not.toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument() // contador reiniciado
      expect(screen.queryByText('Agree')).not.toBeInTheDocument()
      expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    })

    it('loses via timeout, following the standard defeat flow', async () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<AppShell />)

        fireEvent.click(screen.getByText('Empezar'))
        fireEvent.click(screen.getByText('Check'))
        await vi.waitFor(() => expect(screen.getByText('Disagree')).toBeInTheDocument())

        act(() => {
          vi.advanceTimersByTime(100_000)
        })

        resolveGiantVerdict(container)
        fireEvent.click(
          await vi.waitFor(() => screen.getByText('Volver a la selección de niveles')),
        )

        await vi.waitFor(() => expect(screen.getByText('Cookie Preferences')).toBeInTheDocument())
        expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
      } finally {
        vi.useRealTimers()
      }
    })

    it('the countdown keeps running while the error dialog is open, and reaching 0 still triggers the standard timeout defeat (GDD Nivel 1)', async () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<AppShell />)

        fireEvent.click(screen.getByText('Empezar'))
        fireEvent.click(screen.getByText('Check'))
        fireEvent.click(await vi.waitFor(() => screen.getByText('Disagree')))
        await vi.waitFor(() => expect(screen.getByText('Error')).toBeInTheDocument())

        // El diálogo de error se queda abierto; nunca se pulsa OK.
        act(() => {
          vi.advanceTimersByTime(100_000)
        })

        resolveGiantVerdict(container)
        fireEvent.click(
          await vi.waitFor(() => screen.getByText('Volver a la selección de niveles')),
        )

        await vi.waitFor(() => expect(screen.getByText('Cookie Preferences')).toBeInTheDocument())
        expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
      } finally {
        vi.useRealTimers()
      }
    })

    it('closing with X follows the standard defeat flow', async () => {
      const user = userEvent.setup()
      const { container } = render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Check'))
      await screen.findByText('Disagree')

      await user.click(screen.getByRole('button', { name: 'Cerrar' }))
      resolveGiantVerdict(container)
      await user.click(await screen.findByText('Volver a la selección de niveles'))

      expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
      expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    })
  })
})
