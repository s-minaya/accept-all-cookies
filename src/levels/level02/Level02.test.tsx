import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Level02 from './Level02'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import type { LevelProps } from '../types'

const baseProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
  timeLeft: 100,
}

/**
 * Reproduce lo mínimo que `LevelHost` hace de verdad: provee el canal
 * nivel→host (007-plan.md) y pinta el pie que el nivel registre junto al
 * resto del árbol, para que los tests puedan interactuar con los botones tal
 * como aparecerían en la ventana real (fuera del marco azul, GDD §4.5). El
 * nivel 2 no usa rotación ni overlay: esas ranuras son no-op aquí.
 */
function Level02Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLElement>(null)
  const channel: HostChannelValue = useMemo(
    () => ({ setFooter, setWindowTransform: () => {}, setBoard: () => {}, windowRef }),
    [setFooter],
  )
  return (
    <HostChannelContext.Provider value={channel}>
      <Level02 {...props} />
      {footer}
    </HostChannelContext.Provider>
  )
}

describe('Level02 (GDD Nivel 2 — colores de los botones intercambiados)', () => {
  it('renders both buttons from the first render, with no delay', () => {
    render(<Level02Harness {...baseProps} />)
    expect(screen.getByText('Agree')).toBeInTheDocument()
    expect(screen.getByText('Disagree')).toBeInTheDocument()
  })

  it('calls onWin when the red Agree button is pressed', () => {
    const onWin = vi.fn()
    render(<Level02Harness {...baseProps} onWin={onWin} />)

    fireEvent.click(screen.getByText('Agree'))

    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('calls onLose with the wrong-button reason when the green Disagree button is pressed', () => {
    const onLose = vi.fn()
    render(<Level02Harness {...baseProps} onLose={onLose} />)

    fireEvent.click(screen.getByText('Disagree'))

    expect(onLose).toHaveBeenCalledTimes(1)
    expect(onLose).toHaveBeenCalledWith('failed')
  })

  it('the colors are crossed: Agree uses the disagree (red) variant, Disagree uses the agree (green) variant', () => {
    render(<Level02Harness {...baseProps} />)

    const agreeButton = screen.getByText('Agree').closest('button')
    const disagreeButton = screen.getByText('Disagree').closest('button')

    expect(agreeButton?.className).toMatch(/xp-button--disagree/)
    expect(disagreeButton?.className).toMatch(/xp-button--agree/)
  })

  it('disables both buttons while paused', () => {
    render(<Level02Harness {...baseProps} paused={true} />)

    expect(screen.getByText('Agree').closest('button')).toBeDisabled()
    expect(screen.getByText('Disagree').closest('button')).toBeDisabled()
  })
})
