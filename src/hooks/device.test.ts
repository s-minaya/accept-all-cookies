import { afterEach, describe, expect, it, vi } from 'vitest'
import { isCoarsePointerDevice } from './device'

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: coarse }) as unknown as typeof window.matchMedia,
  )
}

describe('isCoarsePointerDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is true on a coarse-pointer (touch) device', () => {
    mockPointer(true)
    expect(isCoarsePointerDevice()).toBe(true)
  })

  it('is false on a fine-pointer (mouse) device', () => {
    mockPointer(false)
    expect(isCoarsePointerDevice()).toBe(false)
  })
})
