import { useCountdown } from '../hooks/useCountdown'
import { XPButton } from '../components/xp/XPButton'
import styles from './Playground.module.css'

export function CountdownDemo() {
  const { remaining, isRunning, pause, resume, reset } = useCountdown(10)

  return (
    <div className={styles.row}>
      <span className={styles.countdownDisplay}>{remaining}</span>
      <XPButton variant="neutral" onClick={isRunning ? pause : resume}>
        {isRunning ? 'Pause' : 'Resume'}
      </XPButton>
      <XPButton variant="neutral" onClick={() => reset()}>
        Reset
      </XPButton>
    </div>
  )
}
