import { useMemo, useRef, useState, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Level01 from './Level01'
import { HostChannelContext, type HostChannelValue } from '../hostChannel'
import { useSettingsStore } from '../../state/settingsStore'
import type { LevelProps } from '../types'

const baseProps = {
  onWin: () => {},
  onLose: () => {},
  paused: false,
}

/**
 * Reproduce lo mínimo que `LevelHost` hace de verdad: provee el canal
 * nivel→host (007-plan.md) y pinta el pie que el nivel registre junto al
 * resto del árbol, para que los tests puedan interactuar con los botones tal
 * como aparecerían en la ventana real (fuera del marco azul, GDD §4.5). El
 * nivel 1 no usa rotación ni overlay: esas ranuras son no-op aquí.
 */
function Level01Harness(props: LevelProps) {
  const [footer, setFooter] = useState<ReactNode>(null)
  const windowRef = useRef<HTMLElement>(null)
  const channel: HostChannelValue = useMemo(
    () => ({ setFooter, setWindowTransform: () => {}, setBoard: () => {}, windowRef }),
    [setFooter],
  )
  return (
    <HostChannelContext.Provider value={channel}>
      <Level01 {...props} />
      {footer}
    </HostChannelContext.Provider>
  )
}

describe('Level01 (GDD Nivel 1)', () => {
  beforeEach(() => {
    useSettingsStore.setState({ language: 'en' })
  })

  it('does not render Agree before 7 elapsed seconds', () => {
    render(<Level01Harness {...baseProps} timeLeft={95} />) // 5s transcurridos
    expect(screen.queryByText('Agree')).not.toBeInTheDocument()
    expect(screen.getByText('Disagree')).toBeInTheDocument()
  })

  it('renders Agree once 7 seconds have elapsed, without shifting the Disagree slot', () => {
    render(<Level01Harness {...baseProps} timeLeft={93} />) // 7s transcurridos
    expect(screen.getByText('Agree')).toBeInTheDocument()
  })

  it('calls onWin when Agree is pressed', () => {
    const onWin = vi.fn()
    render(<Level01Harness {...baseProps} onWin={onWin} timeLeft={50} />)

    fireEvent.click(screen.getByText('Agree'))

    expect(onWin).toHaveBeenCalledTimes(1)
  })

  it('opens the error dialog on Disagree instead of losing', () => {
    const onLose = vi.fn()
    render(<Level01Harness {...baseProps} onLose={onLose} timeLeft={95} />)

    fireEvent.click(screen.getByText('Disagree'))

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Essential cookies cannot be rejected.')).toBeInTheDocument()
    expect(onLose).not.toHaveBeenCalled()
  })

  it('shows the error dialog translated when the language is Spanish', () => {
    useSettingsStore.setState({ language: 'es' })
    render(<Level01Harness {...baseProps} timeLeft={95} />)

    fireEvent.click(screen.getByText('Disagree'))

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Las cookies esenciales no se pueden rechazar.')).toBeInTheDocument()
  })

  it('never loses even if Disagree is pressed repeatedly', () => {
    const onLose = vi.fn()
    render(<Level01Harness {...baseProps} onLose={onLose} timeLeft={95} />)

    const disagreeButton = screen.getByText('Disagree')
    fireEvent.click(disagreeButton)
    fireEvent.click(disagreeButton)
    fireEvent.click(disagreeButton)

    expect(onLose).not.toHaveBeenCalled()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('calls onRestart when OK is pressed on the error dialog', () => {
    const onRestart = vi.fn()
    render(<Level01Harness {...baseProps} onRestart={onRestart} timeLeft={95} />)

    fireEvent.click(screen.getByText('Disagree'))
    fireEvent.click(screen.getByText('OK'))

    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('disables Agree, Disagree and the dialog OK button while paused', () => {
    const { rerender } = render(<Level01Harness {...baseProps} timeLeft={50} paused={false} />)
    fireEvent.click(screen.getByText('Disagree'))
    rerender(<Level01Harness {...baseProps} timeLeft={50} paused={true} />)

    expect(screen.getByText('Agree').closest('button')).toBeDisabled()
    expect(screen.getByText('Disagree').closest('button')).toBeDisabled()
    expect(screen.getByText('OK').closest('button')).toBeDisabled()
  })
})
