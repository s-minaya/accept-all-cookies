import { useState } from 'react'
import { XPButton } from '../components/xp/XPButton'
import { GiantVerdict, type GiantVerdictResult } from '../components/xp/GiantVerdict'
import styles from './GiantVerdictDemo.module.scss'

export function GiantVerdictDemo() {
  const [active, setActive] = useState<GiantVerdictResult | null>(null)

  return (
    <div className={styles['giant-verdict-demo']}>
      <div className={styles['giant-verdict-demo__triggers']}>
        <XPButton variant="agree" onClick={() => setActive('win')}>
          Trigger AGREE
        </XPButton>
        <XPButton variant="disagree" onClick={() => setActive('lose')}>
          Trigger DISAGREE
        </XPButton>
      </div>

      <div className={styles['giant-verdict-demo__stage']}>
        <span>Level content behind the overlay</span>
        {active && <GiantVerdict result={active} onDone={() => setActive(null)} />}
      </div>
    </div>
  )
}
