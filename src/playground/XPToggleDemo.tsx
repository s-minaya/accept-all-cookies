import { useState } from 'react'
import { XPToggle } from '../components/xp/XPToggle'
import styles from './Playground.module.scss'

export function XPToggleDemo() {
  const [musicOn, setMusicOn] = useState(true)

  return (
    <div className={styles['playground__row']}>
      <XPToggle checked={musicOn} onChange={setMusicOn} label="Music" />
    </div>
  )
}
