const MAX_NAME_LENGTH = 16

/**
 * Se aplica al confirmar el campo de nombre de la modal de personaje
 * (GDD §1.1 / 003-spec.md): recorta espacios, limita a 16 caracteres y usa
 * el nombre por defecto del personaje si no queda nada — nunca bloquea el
 * flujo con un error de validación.
 */
export function resolveConfirmedName(rawInput: string, defaultName: string): string {
  const trimmed = rawInput.trim().slice(0, MAX_NAME_LENGTH)
  return trimmed.length > 0 ? trimmed : defaultName
}
