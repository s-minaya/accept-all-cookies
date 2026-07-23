import { useCallback } from 'react'
import { useSettingsStore } from '../state/settingsStore'
import es from './es.json'
import en from './en.json'

const dictionaries = { es, en }

export type TranslateFn = (key: string) => string

function resolve(dictionary: unknown, key: string): string | undefined {
  const value: unknown = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      dictionary,
    )
  return typeof value === 'string' ? value : undefined
}

/**
 * Lee el idioma activo de settingsStore; si falta la clave, devuelve la
 * propia clave (avisando por consola). Estable entre renders mientras el
 * idioma no cambie (`useCallback`): algunos niveles memoizan contenido (p.
 * ej. el pie de botones vía `useLevelFooter`) usando `t` como dependencia, y
 * una función nueva en cada render rompería esa memoización.
 */
export function useT(): TranslateFn {
  const language = useSettingsStore((state) => state.language)

  return useCallback(
    (key: string) => {
      const value = resolve(dictionaries[language], key)
      if (value === undefined) {
        console.warn(`[i18n] Missing key "${key}" for language "${language}"`)
        return key
      }
      return value
    },
    [language],
  )
}
