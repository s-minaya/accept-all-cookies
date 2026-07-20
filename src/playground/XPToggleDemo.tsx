import { useState } from 'react'
import { XPToggle } from '../components/xp/XPToggle'
import styles from './Playground.module.css'

export function XPToggleDemo() {
  const [musicOn, setMusicOn] = useState(true)

  return (
    <div className={styles.row}>
      <XPToggle checked={musicOn} onChange={setMusicOn} label="Music" />
    </div>
  )
}
