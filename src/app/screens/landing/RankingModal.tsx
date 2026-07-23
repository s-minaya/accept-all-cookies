import { XPDialog } from '../../../components/xp/XPDialog'
import { useT } from '../../../i18n/useT'
import { useRankingStore } from '../../../state/rankingStore'
import { sortRanking } from '../../rankingSort'
import { getCharacter } from '../../characters'
import styles from './RankingModal.module.scss'

export interface RankingModalProps {
  onClose: () => void
}

export function RankingModal({ onClose }: RankingModalProps) {
  const t = useT()
  const entries = useRankingStore((state) => state.entries)
  const ranked = sortRanking(entries)

  return (
    <XPDialog title={t('landing.ranking.title')} onClose={onClose} closeLabel={t('landing.close')}>
      {ranked.length === 0 ? (
        <p>{t('landing.ranking.empty')}</p>
      ) : (
        <ul className={styles['ranking-modal__list']}>
          {ranked.map((entry) => (
            <li
              key={entry.username}
              className={[
                styles['ranking-modal__row'],
                entry.finished && styles['ranking-modal__row--finished'],
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <img
                src={getCharacter(entry.character).sprite}
                alt=""
                className={styles['ranking-modal__avatar']}
              />
              <div className={styles['ranking-modal__info']}>
                <span className={styles['ranking-modal__username']}>{entry.username}</span>
                <div className={styles['ranking-modal__meta']}>
                  <span className={styles['ranking-modal__level']}>
                    {entry.finished
                      ? t('landing.ranking.finished')
                      : `${t('shell.select.levelLabel')} ${entry.maxLevel}`}
                  </span>
                  <span className={styles['ranking-modal__date']}>{entry.date}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </XPDialog>
  )
}
