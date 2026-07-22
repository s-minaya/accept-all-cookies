import '@testing-library/jest-dom/vitest'

// jsdom no implementa la reproducción de medios; se simula para que las
// llamadas a `.play()`/`.pause()` de AudioManager no llenen los tests de
// errores "Not implemented".
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => {}
