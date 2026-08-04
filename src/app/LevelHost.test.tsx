import { lazy, useMemo } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LevelHost } from './LevelHost'
import { testLevelDefinition } from '../levels/_test'
import { useLevelOverlay } from '../levels/hostChannel'
import type { LevelDefinition } from '../levels/types'

/** Simula el final de la animación CSS de GiantVerdict (jsdom nunca la ejecuta de verdad). */
function resolveGiantVerdict(container: HTMLElement) {
  const verdictText = container.querySelector('[class*="giant-verdict__text"]')
  if (!verdictText) throw new Error('GiantVerdict text not found — ¿el veredicto no se disparó?')
  fireEvent.animationEnd(verdictText)
}

describe('LevelHost — contador a 0 (GDD §4.2/§8)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('dispatches a lose outcome with reason "timeout" once the countdown hits 0, after the verdict and modal', () => {
    const onExit = vi.fn()
    const { container } = render(
      <LevelHost
        level={testLevelDefinition}
        isFinalLevel={false}
        initialSeconds={5}
        onExit={onExit}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    resolveGiantVerdict(container)
    fireEvent.click(screen.getByText('Volver a la selección de niveles'))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledWith({ outcome: 'lose', reason: 'timeout' })
  })
})

describe('LevelHost — initialOutcome/onOutcome (recarga durante el veredicto/modal, GDD §12)', () => {
  it('with an initialOutcome, boots straight into the modal — no GiantVerdict animation, level frozen behind it', async () => {
    const onExit = vi.fn()
    const { container } = render(
      <LevelHost
        level={testLevelDefinition}
        isFinalLevel={false}
        initialOutcome="win"
        onExit={onExit}
      />,
    )

    expect(container.querySelector('[class*="giant-verdict__text"]')).not.toBeInTheDocument()
    expect(screen.getByText('Cookies Accepted')).toBeInTheDocument()
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Agree' })).toBeDisabled())
    expect(onExit).not.toHaveBeenCalled()
  })

  it('confirming a modal booted from initialOutcome still calls onExit exactly once, with that outcome', () => {
    const onExit = vi.fn()
    render(
      <LevelHost
        level={testLevelDefinition}
        isFinalLevel={false}
        initialOutcome="lose"
        onExit={onExit}
      />,
    )

    fireEvent.click(screen.getByText('Volver a la selección de niveles'))

    expect(onExit).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledWith({ outcome: 'lose', reason: 'failed' })
  })

  it('without an initialOutcome, calls onOutcome exactly once as soon as the level is won, before the verdict animation finishes', async () => {
    const onOutcome = vi.fn()
    const { container } = render(
      <LevelHost
        level={testLevelDefinition}
        isFinalLevel={false}
        onOutcome={onOutcome}
        onExit={() => {}}
      />,
    )

    await vi.waitFor(() => expect(screen.getByText('Agree')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Agree'))

    expect(onOutcome).toHaveBeenCalledTimes(1)
    expect(onOutcome).toHaveBeenCalledWith('win')

    resolveGiantVerdict(container)
    fireEvent.click(screen.getByText('Siguiente'))

    expect(onOutcome).toHaveBeenCalledTimes(1) // no se repite al confirmar la modal
  })
})

describe('LevelHost — onRestart (005-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('remounts the level (clean internal state) and resets the shell countdown to 100 on restart', async () => {
    render(<LevelHost level={testLevelDefinition} isFinalLevel={false} onExit={() => {}} />)
    await vi.waitFor(() => expect(screen.getByText('Restart')).toBeInTheDocument())

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(screen.getByText('90')).toBeInTheDocument() // contador del shell
    expect(screen.getByText('20')).toBeInTheDocument() // contador propio del nivel de prueba

    fireEvent.click(screen.getByText('Restart'))

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument() // estado interno del nivel, limpio de nuevo
  })

  it('resets to 100, not to the reload-resume value, when restarting mid-level', async () => {
    render(
      <LevelHost
        level={testLevelDefinition}
        isFinalLevel={false}
        initialSeconds={45}
        onExit={() => {}}
      />,
    )
    await vi.waitFor(() => expect(screen.getByText('Restart')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Restart'))

    expect(screen.getByText('100')).toBeInTheDocument()
  })
})

describe('LevelHost — ranura overlay (014-plan.md)', () => {
  function OverlayLevel() {
    // Memoizado (deps vacías): una referencia nueva por render entra en
    // bucle con `LevelHost` (AGENTS.md, ya pasó en la 005).
    const overlay = useMemo(() => <div data-testid="overlay-content">soy una copia</div>, [])
    useLevelOverlay(overlay)
    return <span>contenido normal del nivel</span>
  }

  const overlayLevelDefinition: LevelDefinition = {
    titleKey: 'shell.level.testTitle',
    consentKey: 'shell.level.testConsent',
    component: lazy(() => Promise.resolve({ default: OverlayLevel })),
  }

  it('renders what a level publishes via useLevelOverlay as a sibling of the window, above it in DOM order', async () => {
    const { container } = render(
      <LevelHost level={overlayLevelDefinition} isFinalLevel={false} onExit={() => {}} />,
    )

    const overlayNode = await screen.findByTestId('overlay-content')
    const hostNode = container.querySelector('[class*="level-host"]:not([class*="__"])')
    expect(hostNode).not.toBeNull()
    // Hermano de `.level-host`, no descendiente — nunca dentro del
    // contenedor que rota/traslada (si no, heredaría su `transform`).
    expect(overlayNode.closest('[class*="level-host__rotator"]')).toBeNull()
    expect(overlayNode.parentElement?.previousElementSibling).toBe(hostNode)
  })

  it('renders nothing extra when the level never publishes an overlay', () => {
    render(<LevelHost level={testLevelDefinition} isFinalLevel={false} onExit={() => {}} />)

    expect(screen.queryByTestId('overlay-content')).toBeNull()
  })
})

describe('LevelHost — error boundary (017-plan.md, bloque G)', () => {
  const crashingLevelDefinition: LevelDefinition = {
    titleKey: 'shell.level.testTitle',
    consentKey: 'shell.level.testConsent',
    // Fuerza el mismo fallo que un hipo de red real en Pages: el `import()`
    // dinámico del nivel (`React.lazy`) rechaza en vez de resolver.
    component: lazy(() => Promise.reject(new Error('chunk load failed'))),
  }

  it('shows an XP error dialog with a single back button instead of a blank screen when the level chunk fails to load', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onExit = vi.fn()
    render(<LevelHost level={crashingLevelDefinition} isFinalLevel={false} onExit={onExit} />)

    const dialog = await screen.findByRole('dialog')
    // Un único botón dentro del diálogo de error, sin opción de reintentar
    // (017-spec.md: "un mensaje XP y un botón de volver", no más) — la X de
    // la ventana del nivel sigue ahí detrás, heredada de `LevelHost` como
    // siempre, pero no es parte de este diálogo.
    expect(within(dialog).getAllByRole('button')).toHaveLength(1)
    const backButton = within(dialog).getByRole('button', {
      name: /return to level selection|volver a la selección/i,
    })

    fireEvent.click(backButton)
    expect(onExit).toHaveBeenCalledWith({ outcome: 'error' })

    consoleErrorSpy.mockRestore()
  })
})
