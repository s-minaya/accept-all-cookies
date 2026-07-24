import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  HostChannelContext,
  useHostWindowRef,
  useLevelBoard,
  useLevelFooter,
  useWindowRotation,
  type HostChannelValue,
} from './hostChannel'

function makeChannel(overrides: Partial<HostChannelValue> = {}): HostChannelValue {
  return {
    setFooter: vi.fn(),
    setWindowTransform: vi.fn(),
    windowRef: createRef<HTMLElement>(),
    setBoard: vi.fn(),
    ...overrides,
  }
}

describe('hostChannel — canal único nivel→host con ranuras con nombre (007-plan.md)', () => {
  it('useLevelFooter publishes on mount and clears on unmount', () => {
    const channel = makeChannel()

    function Level() {
      useLevelFooter('mi pie')
      return null
    }

    const { unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level />
      </HostChannelContext.Provider>,
    )

    expect(channel.setFooter).toHaveBeenCalledWith('mi pie')

    unmount()

    expect(channel.setFooter).toHaveBeenLastCalledWith(null)
  })

  it('useWindowRotation publishes the degrees as a CSS-ready string and clears on unmount', () => {
    const channel = makeChannel()

    function Level({ deg }: { deg: number }) {
      useWindowRotation(deg)
      return null
    }

    const { rerender, unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level deg={0} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('0deg')

    rerender(
      <HostChannelContext.Provider value={channel}>
        <Level deg={137} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('137deg')

    unmount()
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith(null)
  })

  it('useLevelBoard publishes on mount and clears on unmount', () => {
    const channel = makeChannel()

    function Level() {
      useLevelBoard('mi tablero')
      return null
    }

    const { unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level />
      </HostChannelContext.Provider>,
    )

    expect(channel.setBoard).toHaveBeenCalledWith('mi tablero')

    unmount()

    expect(channel.setBoard).toHaveBeenLastCalledWith(null)
  })

  it('useHostWindowRef returns the ref published by the host', () => {
    const windowRef = createRef<HTMLElement>()
    const channel = makeChannel({ windowRef })
    let received: unknown

    function Level() {
      received = useHostWindowRef()
      return null
    }

    render(
      <HostChannelContext.Provider value={channel}>
        <Level />
      </HostChannelContext.Provider>,
    )

    expect(received).toBe(windowRef)
  })

  it('all hooks no-op safely without a provider (channel is null)', () => {
    function Level() {
      useLevelFooter('x')
      useLevelBoard('y')
      useWindowRotation(10)
      const ref = useHostWindowRef()
      return <span>{ref === null ? 'no-ref' : 'ref'}</span>
    }

    expect(() => render(<Level />)).not.toThrow()
  })
})
