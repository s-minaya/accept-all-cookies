import { AppShell } from './app/AppShell'
import { Playground } from './playground/Playground'

/**
 * `?playground` es un escape de desarrollo/QA, no enrutado del juego: se lee
 * una sola vez al arrancar para elegir el componente raíz, nunca se usa para
 * navegar entre pantallas o niveles. Mantiene la Playground del sistema de
 * diseño accesible en producción para comprobaciones manuales (audio, QA en
 * móvil) hasta que la feature 017 la retire.
 */
function App() {
  const isPlayground = new URLSearchParams(window.location.search).has('playground')
  return isPlayground ? <Playground /> : <AppShell />
}

export default App
