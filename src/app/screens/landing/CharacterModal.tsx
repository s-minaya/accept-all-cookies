import { useState } from 'react'
import { XPDialog } from '../../../components/xp/XPDialog'
import { XPButton } from '../../../components/xp/XPButton'
import { XPTextInput } from '../../../components/xp/XPTextInput'
import { useT } from '../../../i18n/useT'
import { characters, getCharacter, resolvePlayerName } from '../../characters'
import { resolveConfirmedName } from '../../playerForm'
import { usePlayerStore } from '../../../state/playerStore'
import type { CharacterId } from '../../../state/rankingStore'
import styles from './CharacterModal.module.css'

export interface CharacterModalProps {
  onClose: () => void
}

export function CharacterModal({ onClose }: CharacterModalProps) {
  const t = useT()
  const currentCharacter = usePlayerStore((state) => state.character)
  const currentUsername = usePlayerStore((state) => state.username)
  const setPlayer = usePlayerStore((state) => state.setPlayer)

  const [selected, setSelected] = useState<CharacterId>(currentCharacter)
  const [nameInput, setNameInput] = useState(() =>
    resolvePlayerName(currentCharacter, currentUsername),
  )

  const selectCharacter = (id: CharacterId) => {
    setSelected(id)
    setNameInput(getCharacter(id).defaultName)
  }

  const confirm = () => {
    const resolvedName = resolveConfirmedName(nameInput, getCharacter(selected).defaultName)
    setPlayer(selected, resolvedName)
    onClose()
  }

  return (
    <XPDialog
      title={t('landing.character.title')}
      onClose={onClose}
      closeLabel={t('landing.close')}
      maxWidth="32rem"
      footer={
        <XPButton variant="agree" onClick={confirm}>
          {t('landing.character.confirm')}
        </XPButton>
      }
    >
      <div className={styles.grid}>
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            className={[styles.thumb, character.id === selected ? styles.thumbSelected : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectCharacter(character.id)}
            aria-pressed={character.id === selected}
            aria-label={`${t('landing.character.select')} ${character.defaultName}`}
          >
            <img src={character.sprite} alt="" className={styles.thumbImage} />
          </button>
        ))}
      </div>

      <XPTextInput
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        maxLength={16}
        aria-label={t('landing.character.nameLabel')}
        className={styles.nameInput}
      />
    </XPDialog>
  )
}
