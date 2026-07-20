import { useCountdown } from '../hooks/useCountdown'
import { XPButton } from '../components/xp/XPButton'
import styles from './Playground.module.scss'

export function CountdownDemo() {
  const { remaining, isRunning, pause, resume, reset } = useCountdown(10)

  return (
    <div className={styles['playground__row']}>
      <span className={styles['playground__countdown-display']}>{remaining}</span>
      <XPButton variant="neutral" onClick={isRunning ? pause : resume}>
        {isRunning ? 'Pause' : 'Resume'}
      </XPButton>
      <XPButton variant="neutral" onClick={() => reset()}>
        Reset
      </XPButton>
    </div>
  )
}
