import type { CSSProperties } from 'react'
import { CuteButton } from '../components/cute/CuteButton'
import landingBg from '../assets/images/landing-bg.png'
import styles from './CuteButtonDemo.module.scss'

export function CuteButtonDemo() {
  const backgroundVars = { '--bg-image': `url(${landingBg})` } as CSSProperties

  return (
    <div className={styles['cute-button-demo__stage']} style={backgroundVars}>
      <CuteButton>Empezar</CuteButton>
      <CuteButton disabled>Empezar</CuteButton>
    </div>
  )
}
