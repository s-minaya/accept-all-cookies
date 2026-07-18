/**
 * The only module in the project allowed to touch `localStorage` (AGENTS.md).
 * Falls back to an in-memory map when localStorage throws (disabled, private
 * mode, quota exceeded) so the game always boots with sane defaults instead
 * of crashing.
 */

const memoryFallback = new Map<string, string>()

function getLocalStorage(): Storage | null {
  try {
    const probeKey = '__aac_storage_probe__'
    window.localStorage.setItem(probeKey, probeKey)
    window.localStorage.removeItem(probeKey)
    return window.localStorage
  } catch {
    return null
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const storage = getLocalStorage()
    const raw = storage ? storage.getItem(key) : (memoryFallback.get(key) ?? null)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value)
    const storage = getLocalStorage()
    if (storage) {
      storage.setItem(key, serialized)
    } else {
      memoryFallback.set(key, serialized)
    }
  } catch {
    // Storage unavailable or write failed (quota, private mode): ignore,
    // the in-memory fallback (or next successful write) takes over.
  }
}
