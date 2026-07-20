import { CuteButton } from '../components/cute/CuteButton'
import landingBg from '../assets/images/landing-bg.png'
import styles from './CuteButtonDemo.module.css'

export function CuteButtonDemo() {
  return (
    <div className={styles.stage} style={{ backgroundImage: `url(${landingBg})` }}>
      <CuteButton>Empezar</CuteButton>
      <CuteButton disabled>Empezar</CuteButton>
    </div>
  )
}
