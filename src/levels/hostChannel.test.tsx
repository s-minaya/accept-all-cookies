import { createRef } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  HostChannelContext,
  useHostTitleBarRef,
  useHostWindowRef,
  useLevelBoard,
  useLevelFooter,
  useLevelOverlay,
  useWindowRotation,
  useWindowTranslation,
  useWindowZIndex,
  type HostChannelValue,
} from './hostChannel'

function makeChannel(overrides: Partial<HostChannelValue> = {}): HostChannelValue {
  return {
    setFooter: vi.fn(),
    setWindowTransform: vi.fn(),
    setWindowZIndex: vi.fn(),
    windowRef: createRef<HTMLElement>(),
    titleBarRef: createRef<HTMLDivElement>(),
    setBoard: vi.fn(),
    setOverlay: vi.fn(),
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

  it('useWindowRotation publishes a ready-to-use rotate() transform and clears on unmount', () => {
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
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('rotate(0deg)')

    rerender(
      <HostChannelContext.Provider value={channel}>
        <Level deg={137} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('rotate(137deg)')

    unmount()
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith(null)
  })

  it('useWindowTranslation publishes a ready-to-use translate() transform and clears on unmount', () => {
    const channel = makeChannel()

    function Level({ x, y }: { x: number; y: number }) {
      useWindowTranslation(x, y)
      return null
    }

    const { rerender, unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level x={0} y={0} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('translate(0px, 0px)')

    rerender(
      <HostChannelContext.Provider value={channel}>
        <Level x={12} y={-34} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith('translate(12px, -34px)')

    unmount()
    expect(channel.setWindowTransform).toHaveBeenLastCalledWith(null)
  })

  it('useWindowZIndex publishes the number and clears on unmount', () => {
    const channel = makeChannel()

    function Level({ zIndex }: { zIndex: number }) {
      useWindowZIndex(zIndex)
      return null
    }

    const { rerender, unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level zIndex={1} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowZIndex).toHaveBeenLastCalledWith(1)

    rerender(
      <HostChannelContext.Provider value={channel}>
        <Level zIndex={7} />
      </HostChannelContext.Provider>,
    )
    expect(channel.setWindowZIndex).toHaveBeenLastCalledWith(7)

    unmount()
    expect(channel.setWindowZIndex).toHaveBeenLastCalledWith(null)
  })

  it('useLevelOverlay publishes on mount and clears on unmount', () => {
    const channel = makeChannel()

    function Level() {
      useLevelOverlay('mi overlay')
      return null
    }

    const { unmount } = render(
      <HostChannelContext.Provider value={channel}>
        <Level />
      </HostChannelContext.Provider>,
    )

    expect(channel.setOverlay).toHaveBeenCalledWith('mi overlay')

    unmount()

    expect(channel.setOverlay).toHaveBeenLastCalledWith(null)
  })

  it('useHostTitleBarRef returns the ref published by the host', () => {
    const titleBarRef = createRef<HTMLDivElement>()
    const channel = makeChannel({ titleBarRef })
    let received: unknown

    function Level() {
      received = useHostTitleBarRef()
      return null
    }

    render(
      <HostChannelContext.Provider value={channel}>
        <Level />
      </HostChannelContext.Provider>,
    )

    expect(received).toBe(titleBarRef)
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
      useLevelOverlay('z')
      useWindowRotation(10)
      useWindowTranslation(1, 2)
      useWindowZIndex(1)
      const ref = useHostWindowRef()
      const titleBarRef = useHostTitleBarRef()
      return <span>{ref === null && titleBarRef === null ? 'no-ref' : 'ref'}</span>
    }

    expect(() => render(<Level />)).not.toThrow()
  })
})
