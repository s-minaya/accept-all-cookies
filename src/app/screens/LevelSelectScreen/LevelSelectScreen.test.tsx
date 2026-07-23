import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LevelSelectScreen } from './LevelSelectScreen'
import type { LevelId } from '../../../levels/types'

describe('LevelSelectScreen (GDD §5)', () => {
  it('shows no counter and no close button', () => {
    render(
      <LevelSelectScreen
        completedLevels={[]}
        currentLevel={1}
        onCheck={() => {}}
        onBack={() => {}}
      />,
    )

    expect(screen.queryByRole('button', { name: /close|cerrar/i })).not.toBeInTheDocument()
    // El span del contador sigue existiendo (misma TitleBar de siempre) pero vacío.
    const counter = document.querySelector('[class*="title-bar__counter"]')
    expect(counter).toBeInTheDocument()
    expect(counter).toHaveTextContent('')
  })

  it('renders the 12 levels with locked/available/done states', () => {
    render(
      <LevelSelectScreen
        completedLevels={[1, 2]}
        currentLevel={3}
        onCheck={() => {}}
        onBack={() => {}}
      />,
    )

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(12)

    // 1 y 2: completados (verde + check).
    expect(rows[0].className).toMatch(/row--done/)
    expect(rows[1].className).toMatch(/row--done/)
    expect(rows[0].querySelector('img')).toBeInTheDocument()

    // 3: disponible (el siguiente a jugar) — lleva el botón Check en línea.
    expect(rows[2].className).toMatch(/row--available/)
    expect(rows[2].querySelector('img')).not.toBeInTheDocument()
    expect(rows[2].querySelector('button')).toHaveTextContent('Check')

    // 4-12: bloqueados, sin check ni botón.
    for (const row of rows.slice(3)) {
      expect(row.className).toMatch(/row--locked/)
      expect(row.querySelector('img')).not.toBeInTheDocument()
      expect(row.querySelector('button')).not.toBeInTheDocument()
    }
  })

  it('Check opens the first pending level', async () => {
    const user = userEvent.setup()
    const onCheck = vi.fn()
    render(
      <LevelSelectScreen
        completedLevels={[1]}
        currentLevel={2}
        onCheck={onCheck}
        onBack={() => {}}
      />,
    )

    await user.click(screen.getByText('Check'))
    expect(onCheck).toHaveBeenCalledTimes(1)
  })

  it('shows no Check button once all 12 levels are completed (no level is "available")', () => {
    const allLevels: LevelId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    render(
      <LevelSelectScreen
        completedLevels={allLevels}
        currentLevel={12}
        onCheck={() => {}}
        onBack={() => {}}
      />,
    )

    expect(screen.queryByText('Check')).not.toBeInTheDocument()
  })
})
