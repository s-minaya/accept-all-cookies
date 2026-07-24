import '@testing-library/jest-dom/vitest'

// jsdom no implementa la reproducción de medios; se simula para que las
// llamadas a `.play()`/`.pause()` de AudioManager no llenen los tests de
// errores "Not implemented".
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}

// jsdom tampoco implementa la captura de puntero (todos los navegadores
// reales sí): se simula como no-op para que `usePointer` (que la usa para
// que el arrastre siga funcionando aunque el dedo/ratón salga del elemento)
// no lance "Not implemented" al simular eventos pointerdown en los tests.
HTMLElement.prototype.setPointerCapture = () => {}
HTMLElement.prototype.releasePointerCapture = () => {}
HTMLElement.prototype.hasPointerCapture = () => false

// jsdom no implementa `PointerEvent` en absoluto (`fireEvent.pointerDown`
// etc. de Testing Library caen en un evento genérico sin `clientX`/`clientY`
// reales). Se rellena con un `MouseEvent` ampliado — lo justo para que
// `usePointer` (clientX/clientY + pointerId) funcione en los tests de
// arrastre (nivel 3, 007-plan.md).
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId: number
    public pointerType: string
    public isPrimary: boolean

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
      this.pointerId = params.pointerId ?? 0
      this.pointerType = params.pointerType ?? 'mouse'
      this.isPrimary = params.isPrimary ?? true
    }
  }

  // @ts-expect-error - relleno mínimo de un global que jsdom no implementa
  window.PointerEvent = PointerEventPolyfill
}
