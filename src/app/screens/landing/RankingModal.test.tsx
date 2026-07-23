import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { RankingModal } from './RankingModal'
import { useRankingStore } from '../../../state/rankingStore'
import { useSettingsStore } from '../../../state/settingsStore'

describe('RankingModal', () => {
  beforeEach(() => {
    useRankingStore.setState({ entries: [] })
    useSettingsStore.setState({ language: 'es' })
  })

  it('shows the empty state when there are no records', () => {
    render(<RankingModal onClose={() => {}} />)
    expect(screen.getByText('Todavía no hay récords. ¡Sé el primero!')).toBeInTheDocument()
  })

  it('lists seeded records sorted by maxLevel (GDD §1.2)', () => {
    useRankingStore.setState({
      entries: [
        { username: 'nay', character: 1, maxLevel: 3, date: '2026-01-01' },
        { username: 'sofia', character: 2, maxLevel: 9, date: '2026-01-01' },
      ],
    })

    render(<RankingModal onClose={() => {}} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('sofia')
    expect(rows[0]).toHaveTextContent('9')
    expect(rows[1]).toHaveTextContent('nay')
    expect(rows[1]).toHaveTextContent('3')
  })

  it('shows a finished run distinguishably from one that only reached level 12', () => {
    useRankingStore.setState({
      entries: [
        { username: 'sofia', character: 2, maxLevel: 12, date: '2026-01-01' },
        { username: 'nay', character: 0, maxLevel: 12, date: '2026-01-01', finished: true },
      ],
    })

    render(<RankingModal onClose={() => {}} />)

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Nivel 12')
    expect(rows[0]).not.toHaveTextContent('¡Completado!')
    expect(rows[1]).toHaveTextContent('¡Completado!')
  })
})
