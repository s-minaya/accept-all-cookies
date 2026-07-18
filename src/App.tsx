import { AppShell } from './app/AppShell'
import { Playground } from './playground/Playground'

/**
 * `?playground` is a dev/QA escape hatch, not game routing: it's read once
 * at boot to pick a root component, never used to navigate screens or
 * levels. Keeps the design-system Playground reachable in production for
 * manual checks (audio, mobile QA) until feature 017 retires it.
 */
function App() {
  const isPlayground = new URLSearchParams(window.location.search).has('playground')
  return isPlayground ? <Playground /> : <AppShell />
}

export default App
