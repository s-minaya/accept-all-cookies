import { useState } from 'react'
import { XPSlider } from '../components/xp/XPSlider'
import styles from './Playground.module.css'

export function XPSliderDemo() {
  const [value, setValue] = useState(0.8)
  const [commits, setCommits] = useState(0)

  return (
    <div className={styles.row}>
      <XPSlider
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={setValue}
        onCommit={() => setCommits((count) => count + 1)}
        ariaLabel="Volume"
      />
      <span>
        {Math.round(value * 100)}% — released {commits}×
      </span>
    </div>
  )
}
