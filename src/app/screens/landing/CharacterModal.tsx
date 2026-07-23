import { useState } from 'react'
import { XPDialog } from '../../../components/xp/XPDialog'
import { XPButton } from '../../../components/xp/XPButton'
import { XPTextInput } from '../../../components/xp/XPTextInput'
import { useT } from '../../../i18n/useT'
import { characters, getCharacter, resolvePlayerName } from '../../characters'
import { resolveConfirmedName } from '../../playerForm'
import { usePlayerStore } from '../../../state/playerStore'
import { useRunStore } from '../../../state/runStore'
import type { CharacterId } from '../../../state/rankingStore'
import styles from './CharacterModal.module.scss'

export interface CharacterModalProps {
  onClose: () => void
}

export function CharacterModal({ onClose }: CharacterModalProps) {
  const t = useT()
  const currentCharacter = usePlayerStore((state) => state.character)
  const currentUsername = usePlayerStore((state) => state.username)
  const setPlayer = usePlayerStore((state) => state.setPlayer)
  const resetRun = useRunStore((state) => state.resetRun)

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
    const previousResolvedName = resolvePlayerName(currentCharacter, currentUsername)
    const isNewPlayer = selected !== currentCharacter || resolvedName !== previousResolvedName

    setPlayer(selected, resolvedName)
    // Cambiar de jugador empieza una partida nueva (004-plan.md): el progreso
    // de la partida en curso es de quien esté jugando ahora mismo, no se
    // hereda de quien jugara antes con otro personaje o nombre.
    if (isNewPlayer) resetRun()
    onClose()
  }

  return (
    <XPDialog
      title={t('landing.character.title')}
      onClose={onClose}
      closeLabel={t('landing.close')}
      className={styles['character-modal__dialog']}
      footer={
        <XPButton variant="agree" onClick={confirm}>
          {t('landing.character.confirm')}
        </XPButton>
      }
    >
      <div className={styles['character-modal__grid']}>
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            className={[
              styles['character-modal__thumb'],
              character.id === selected ? styles['character-modal__thumb--selected'] : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectCharacter(character.id)}
            aria-pressed={character.id === selected}
            aria-label={`${t('landing.character.select')} ${character.defaultName}`}
          >
            <img src={character.sprite} alt="" className={styles['character-modal__thumb-image']} />
          </button>
        ))}
      </div>

      <XPTextInput
        value={nameInput}
        onChange={(event) => setNameInput(event.target.value)}
        maxLength={16}
        aria-label={t('landing.character.nameLabel')}
        className={styles['character-modal__name-input']}
      />
    </XPDialog>
  )
}
