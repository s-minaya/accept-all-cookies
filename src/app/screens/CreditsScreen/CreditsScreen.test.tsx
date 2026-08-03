import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreditsScreen } from './CreditsScreen'

describe('CreditsScreen (GDD §10, 016-plan.md)', () => {
  it('shows no counter and no close button — this is the real end of the game', () => {
    render(<CreditsScreen onBack={() => {}} />)

    expect(screen.queryByRole('button', { name: /close|cerrar/i })).not.toBeInTheDocument()
    const counter = document.querySelector('[class*="title-bar__counter"]')
    expect(counter).toBeInTheDocument()
    expect(counter).toHaveTextContent('')
  })

  it('credits Sofía Minaya solo for three roles, and Sofía + Claude for code', () => {
    render(<CreditsScreen onBack={() => {}} />)
    expect(screen.getAllByText('Sofía Minaya')).toHaveLength(3)
    expect(screen.getByText(/Sofía Minaya & Claude/)).toBeInTheDocument()
  })

  it('credits the inspiration, the Sans/Toby Fox special appearance (requirement inherited from the 015), and thanks the player', () => {
    render(<CreditsScreen onBack={() => {}} />)
    expect(screen.getByText('Doki Doki Action Game')).toBeInTheDocument()
    expect(screen.getByText(/Toby Fox/)).toBeInTheDocument()
    expect(screen.getByText(/Undertale/)).toBeInTheDocument()
    expect(screen.getByText(/^A ti\./)).toBeInTheDocument()
  })

  it('has a single button that goes back', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<CreditsScreen onBack={onBack} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)

    await user.click(buttons[0])
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('celebrates with confetti, hidden from assistive tech and never blocking the back button', () => {
    render(<CreditsScreen onBack={() => {}} />)

    const confetti = document.querySelector('[class*="confetti"]')
    expect(confetti).toBeInTheDocument()
    expect(confetti).toHaveAttribute('aria-hidden', 'true')
    expect(confetti?.querySelectorAll('[class*="confetti__piece"]').length).toBeGreaterThan(0)
    // No debe añadir ningún botón/rol accesible extra ni robar el único botón real.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
