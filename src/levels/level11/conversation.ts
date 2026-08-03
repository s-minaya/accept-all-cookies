export type Answer = 'yes' | 'no'
export type AnswerOutcome = 'advance' | 'win' | 'lose'

export interface ConversationStep {
  /** Clave i18n de la pregunta (`levels.11.q1`…`q4`). */
  questionKey: string
  expected: Answer
}

/**
 * GDD Nivel 11: cuatro preguntas que se repiten dos veces idénticas (8 pasos
 * en total) — el mismo guion, sin ninguna diferencia entre la primera y la
 * segunda vuelta. Ningún par de pasos consecutivos comparte texto (aunque
 * las preguntas 1-4 se repitan en 5-8): `useTypewriter.ts` se apoya en esta
 * garantía para detectar "frase nueva" comparando el texto visible.
 */
export const SCRIPT: readonly ConversationStep[] = [
  { questionKey: 'levels.11.q1', expected: 'no' },
  { questionKey: 'levels.11.q2', expected: 'no' },
  { questionKey: 'levels.11.q3', expected: 'no' },
  { questionKey: 'levels.11.q4', expected: 'yes' },
  { questionKey: 'levels.11.q1', expected: 'no' },
  { questionKey: 'levels.11.q2', expected: 'no' },
  { questionKey: 'levels.11.q3', expected: 'no' },
  { questionKey: 'levels.11.q4', expected: 'yes' },
]

/**
 * Resuelve la respuesta del jugador en el paso `step` (0-indexado): la
 * trampa psicológica del nivel (GDD Nivel 11) vive por completo en el
 * contenido de `SCRIPT`, esta función es solo la comparación.
 */
export function answer(step: number, given: Answer): AnswerOutcome {
  const current = SCRIPT[step]
  if (!current || current.expected !== given) return 'lose'
  return step === SCRIPT.length - 1 ? 'win' : 'advance'
}
