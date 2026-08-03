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

    await user.click(screen.getByText('Comprobar'))
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

    await user.click(screen.getByText('Comprobar'))
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

    await user.click(screen.getByText('Comprobar'))
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
      await user.click(screen.getByText('Comprobar'))
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
      await user.click(screen.getByText('Comprobar'))
      await user.click(await screen.findByText('Disagree'))

      expect(playNegative).toHaveBeenCalled()
    })
  })

  describe('récord del ranking (004)', () => {
    it('records the level being opened as the ranking record', async () => {
      const user = userEvent.setup()
      render(<AppShell />)

      await user.click(screen.getByText('Empezar'))
      await user.click(screen.getByText('Comprobar'))
      // Disagree (no Agree): en el nivel 1 real, Agree tarda 7s en aparecer.
      await screen.findByText('Disagree')

      expect(useRankingStore.getState().entries).toEqual([expect.objectContaining({ maxLevel: 1 })])
    })

    it('marks the run as finished after winning level 12', async () => {
      // El nivel 12 (Accept All, 016-plan.md) no se gana con un simple
      // `getByText('Agree')`: hace falta pulsar el botón protagonista
      // `switchAt` veces (aleatorio 15-35), esperar 2s y pulsar de nuevo —
      // se salta con el botón dev, igual que el resto de niveles no
      // deterministas de este archivo (ver el bloque de comentarios del
      // recorrido completo, más abajo). El botón dev llama a `onExit`
      // directamente (sin GiantVerdict ni modal), pero `completeLevel` y
      // `markFinished` se aplican igual — es lo que se comprueba aquí.
      const user = userEvent.setup()
      window.history.pushState({}, '', '?dev')
      useRunStore.setState({
        completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        currentLevel: 12,
        activeLevelTimeLeft: null,
      })
      render(<AppShell />)

      await user.click(screen.getByText('Comprobar'))
      await user.click(await screen.findByText('Saltar nivel (dev)'))

      expect(useRankingStore.getState().entries).toEqual([
        expect.objectContaining({ maxLevel: 12, finished: true }),
      ])
      window.history.pushState({}, '', '/')
    })
  })

  it('plays a full run, winning all 12 levels in order, ending with Check disabled', async () => {
    // Fake timers: el nivel 1 real tarda 7s (simulados) en mostrar Agree.
    vi.useFakeTimers()
    try {
      const { container } = render(<AppShell />)

      fireEvent.click(screen.getByText('Empezar'))

      // Niveles 4 (Plinko, 008-plan.md) y 5 (tragaperras, 009-plan.md): se
      // ganan por colisión física / azar con RNG real, no por un clic
      // determinista — inalcanzables con `fireEvent.click(getByText('Agree'))`
      // como el resto. Nivel 6 (Cross-Site Tracking, 010-plan.md): el Agree
      // real empieza deshabilitado hasta abrir el candado con una secuencia
      // de direcciones concreta, tampoco un simple clic. Nivel 8 (trilero,
      // 012-plan.md): pulsar "Agree" en el reveal solo ARRANCA el barajado
      // (flip + 3 rondas, ~4,9s) — el clic que gana de verdad cae en una
      // celda sin etiqueta "Agree" (todas dicen `???` tras el flip) y en una
      // posición que cambia con cada partida, no reproducible con un simple
      // `getByText('Agree')`. Nivel 9 (Fingerprinting, 013-plan.md): la
      // cuadrícula empieza vacía del todo — no hay ningún "Agree" que
      // pulsar hasta que una casilla lo genere sola (400–1200ms aleatorios
      // por casilla) o el jugador se quede quieto sobre una, ninguno de los
      // dos reproducible con un simple `getByText('Agree')`. Nivel 10
      // (Legitimate Interest, 014-plan.md): la ventana arranca con dos
      // Disagree — no hay ningún Agree hasta duplicarla 6 veces y que el
      // sorteo (al llegar a 7) le toque a una en concreto, tampoco
      // reproducible con un simple `getByText('Agree')`. Nivel 11 (Consent
      // Renewal, 015-plan.md): no hay ningún "Agree" en el nivel entero — la
      // victoria real es la octava respuesta "Yes" del bocadillo de Sans,
      // tras ocho preguntas con su efecto de escritura letra a letra. Nivel
      // 12 (Accept All, 016-plan.md): tampoco un simple clic — hace falta
      // pulsar el botón protagonista `switchAt` veces (aleatorio 15-35),
      // esperar 2s y pulsar de nuevo. Esa cobertura ya vive en
      // `Level06.test.tsx`, `Level08.test.tsx`, `Level09.test.tsx`,
      // `Level10.test.tsx`, `Level11.test.tsx` y `Level12.test.tsx`
      // (incluida una partida ganadora determinista en cada uno). Los ocho
      // se saltan con el botón dev en vez de duplicar esa cobertura aquí
      // (`?dev` no afecta a ningún otro nivel de este recorrido).
      window.history.pushState({}, '', '?dev')

      for (let level = 1; level <= 12; level++) {
        fireEvent.click(screen.getByText('Comprobar'))

        if (level === 12) {
          // Al ser el nivel final, saltarlo navega directo a los créditos
          // (016-plan.md) en vez de volver a la pantalla de selección — no
          // hay "siguiente nivel" que comprobar tras el 12.
          fireEvent.click(await vi.waitFor(() => screen.getByText('Saltar nivel (dev)')))
          await vi.waitFor(() => expect(screen.getByText('CRÉDITOS')).toBeInTheDocument())
          break
        }

        if (
          level === 4 ||
          level === 5 ||
          level === 6 ||
          level === 8 ||
          level === 9 ||
          level === 10 ||
          level === 11
        ) {
          fireEvent.click(await vi.waitFor(() => screen.getByText('Saltar nivel (dev)')))
          await vi.waitFor(() => expect(screen.getByText('Cookie Preferences')).toBeInTheDocument())
          continue
        }

        // `getAllByText` (no `getByText`): el nivel 3 tiene muchos Disagree
        // a la vez (el fijo del pie + los de la lluvia, 007-plan.md) — esto
        // solo espera a que el nivel haya montado, no importa cuántos haya.
        await vi.waitFor(() => expect(screen.getAllByText('Disagree').length).toBeGreaterThan(0))

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
      // Tras los créditos con la partida completa, el botón de volver
      // reinicia el run (016-plan.md) — el ranking conserva el récord.
      fireEvent.click(screen.getByText('Volver al inicio'))
      expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
      expect(useRankingStore.getState().entries).toEqual([
        expect.objectContaining({ maxLevel: 12, finished: true }),
      ])
      expect(screen.getByText('Empezar')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
      window.history.pushState({}, '', '/')
    }
  })

  describe('Nivel 1 — Essential Cookies (005)', () => {
    it('wins through the standard flow once Agree appears, showing the Essential Cookies category', async () => {
      vi.useFakeTimers()
      try {
        const { container } = render(<AppShell />)

        fireEvent.click(screen.getByText('Empezar'))
        fireEvent.click(screen.getByText('Comprobar'))
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
      await user.click(screen.getByText('Comprobar'))
      await user.click(await screen.findByText('Disagree'))

      expect(await screen.findByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Las cookies esenciales no se pueden rechazar.')).toBeInTheDocument()
      expect(playNegative).not.toHaveBeenCalled()

      await user.click(screen.getByText('Aceptar'))

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
        fireEvent.click(screen.getByText('Comprobar'))
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
        fireEvent.click(screen.getByText('Comprobar'))
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
      await user.click(screen.getByText('Comprobar'))
      await screen.findByText('Disagree')

      await user.click(screen.getByRole('button', { name: 'Cerrar' }))
      resolveGiantVerdict(container)
      await user.click(await screen.findByText('Volver a la selección de niveles'))

      expect(await screen.findByText('Cookie Preferences')).toBeInTheDocument()
      expect(useRunStore.getState()).toMatchObject({ completedLevels: [], currentLevel: 1 })
    })
  })
})
