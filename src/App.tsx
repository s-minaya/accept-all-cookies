import { Suspense, lazy } from 'react'
import { AppShell } from './app/AppShell'

/**
 * `?playground` es un escape de desarrollo/QA, no enrutado del juego: se lee
 * una sola vez al arrancar para elegir el componente raíz, nunca se usa para
 * navegar entre pantallas o niveles.
 *
 * Gateada por `import.meta.env.DEV` (feature 017, bloque A): Vite sustituye
 * esta constante por un literal en build-time, así que en producción esta
 * rama es código muerto detectable en build-time y el `import()` de
 * `Playground` (con él, el nivel de prueba, que solo ella referencia) ni
 * siquiera aparece como chunk en `dist/` — verificado sobre el propio
 * `dist/`, no supuesto (017-plan.md, "nada se da por bueno por deducción").
 * `npm run dev` la sigue sirviendo entera: la herramienta del sistema de
 * diseño no desaparece, solo su alcance en producción.
 */
const Playground = import.meta.env.DEV
  ? lazy(() => import('./playground/Playground').then((m) => ({ default: m.Playground })))
  : null

function App() {
  const isPlayground =
    Playground !== null && new URLSearchParams(window.location.search).has('playground')
  if (isPlayground && Playground) {
    return (
      <Suspense fallback={null}>
        <Playground />
      </Suspense>
    )
  }
  return <AppShell />
}

export default App
