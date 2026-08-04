import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.scss'
import './styles/fonts.scss'
import './styles/reset.scss'
import App from './App.tsx'
import { printConsoleGreeting } from './app/consoleGreeting.ts'

printConsoleGreeting()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
