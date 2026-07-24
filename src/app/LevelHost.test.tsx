import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LevelHost } from './LevelHost'
import { testLevelDefinition } from '../levels/_test'

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
