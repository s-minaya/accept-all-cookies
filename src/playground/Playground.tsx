import type { ReactNode } from 'react'
import { XPButton } from '../components/xp/XPButton'
import { XPWindow } from '../components/xp/XPWindow'
import { GameArea } from '../components/GameArea'
import { CountdownDemo } from './CountdownDemo'
import { PointerDemo } from './PointerDemo'
import { DialogDemo } from './DialogDemo'
import { AudioDemo } from './AudioDemo'
import { CuteButtonDemo } from './CuteButtonDemo'
import { XPTextInputDemo } from './XPTextInputDemo'
import { XPSliderDemo } from './XPSliderDemo'
import { XPToggleDemo } from './XPToggleDemo'
import styles from './Playground.module.scss'

const ESSENTIAL_COOKIES_TEXT = `Cookie Consent

This website uses essential cookies required for the website
to function properly.

Without these cookies, some features may not work correctly.

Do you agree to the Essential Cookies?`

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles['playground__section']}>
      <h2 className={styles['playground__section-title']}>{title}</h2>
      {children}
    </section>
  )
}

export function Playground() {
  return (
    <main className={styles['playground__page']}>
      <div className={styles['playground__intro']}>
        <h1>Accept All Cookies — Design System Playground</h1>
        <p>
          Every reusable piece from feature 001, shown with real text from the GDD. This page is the
          one published on GitHub Pages until the game shell exists (feature 002+).
        </p>
      </div>

      <Section title="Fonts">
        <div className={styles['playground__font-sample']}>
          <span className={styles['playground__font-sample-label']}>
            UI — DotGothic16 (candidate)
          </span>
          <p className={styles['playground__ui-font-text']}>
            ¡Está seleccionando la categoría de cookies de análisis! Configuración de privacidad y
            política de cookies — áéíóúñ ¿todo bien?
          </p>
        </div>
        <div className={styles['playground__font-sample']}>
          <span className={styles['playground__font-sample-label']}>
            Display — Press Start 2P (candidate)
          </span>
          <p className={styles['playground__display-font-text']}>AGREE · DISAGREE</p>
        </div>
      </Section>

      <Section title="XPButton">
        <div className={styles['playground__row']}>
          <div className={styles['playground__button-sample']}>
            <XPButton variant="agree">Agree</XPButton>
            <span>agree — normal / hover / pressed</span>
          </div>
          <div className={styles['playground__button-sample']}>
            <XPButton variant="disagree">Disagree</XPButton>
            <span>disagree</span>
          </div>
          <div className={styles['playground__button-sample']}>
            <XPButton variant="neutral">OK</XPButton>
            <span>neutral</span>
          </div>
          <div className={styles['playground__button-sample']}>
            <XPButton variant="agree" disabled>
              Agree
            </XPButton>
            <span>disabled</span>
          </div>
        </div>
      </Section>

      <Section title="XPWindow">
        <XPWindow
          title="Essential Cookies"
          counter={87}
          closeLabel="Close"
          onClose={() => alert('X pressed — this always means instant defeat in the real game.')}
          consentText={ESSENTIAL_COOKIES_TEXT}
          footer={
            <>
              <XPButton variant="agree">Agree</XPButton>
              <XPButton variant="disagree">Disagree</XPButton>
            </>
          }
        >
          <div className={styles['playground__window-demo-content']}>
            Level mechanic renders here
          </div>
        </XPWindow>
      </Section>

      <Section title="CuteButton (Empezar) — checkpoint pendiente de aprobación">
        <p>
          Lenguaje visual distinto del sistema XP (GDD §1.1): pixel art cute con un corazón, sobre
          el fondo real de la landing.
        </p>
        <CuteButtonDemo />
      </Section>

      <Section title="XPTextInput">
        <XPTextInputDemo />
      </Section>

      <Section title="XPSlider">
        <XPSliderDemo />
      </Section>

      <Section title="XPToggle">
        <XPToggleDemo />
      </Section>

      <Section title="XPDialog">
        <p>No close button by design — shown on top of the whole page, background still visible.</p>
        <DialogDemo />
      </Section>

      <Section title="useCountdown">
        <CountdownDemo />
      </Section>

      <Section title="usePointer">
        <PointerDemo />
      </Section>

      <Section title="Audio (tap anywhere on the page first — autoplay unlock)">
        <AudioDemo />
      </Section>

      <Section title="GameArea (640×360 logical canvas)">
        <p>Resize the dashed box below (drag its bottom-right corner) to see the canvas scale.</p>
        <div className={styles['playground__game-area-host']}>
          <GameArea>
            <div className={styles['playground__canvas-fill']}>
              <span className={styles['playground__canvas-fill-label']}>640 × 360</span>
            </div>
          </GameArea>
        </div>
      </Section>
    </main>
  )
}
