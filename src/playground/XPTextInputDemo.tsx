import { useState } from 'react'
import { XPTextInput } from '../components/xp/XPTextInput'
import styles from './Playground.module.css'

export function XPTextInputDemo() {
  const [value, setValue] = useState('Crumbs')

  return (
    <div className={styles.row}>
      <XPTextInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={16}
        placeholder="Player name"
        aria-label="Player name"
      />
      <span>{value.length}/16</span>
    </div>
  )
}
