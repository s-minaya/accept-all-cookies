/**
 * El único módulo del proyecto autorizado a tocar `localStorage` (AGENTS.md).
 * Si localStorage lanza un error (deshabilitado, modo privado, cuota
 * agotada), recurre a un mapa en memoria, para que el juego siempre arranque
 * con valores por defecto en vez de romperse.
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
    // Almacenamiento no disponible o escritura fallida (cuota, modo
    // privado): se ignora, el respaldo en memoria (o la siguiente
    // escritura que funcione) toma el relevo.
  }
}
