import { XPButton } from '../../../components/xp/XPButton'
import { XPWindow } from '../../../components/xp/XPWindow'
import { useT } from '../../../i18n/useT'
import { Confetti } from './Confetti'
import styles from './CreditsScreen.module.scss'

export interface CreditsScreenProps {
  /** Reinicia la partida (`resetRun`) y vuelve a la landing (GDD §10, 016-plan.md). */
  onBack: () => void
}

/**
 * Pantalla de créditos (GDD §10, 016-plan.md): reemplaza el placeholder de
 * la 002. Se llega aquí solo desde el botón Credits del Level Complete del
 * nivel 12 — es el final real del juego. `roles`/`appearances` repiten el
 * patrón "etiqueta + guía de puntos + valor" (dotted leader por CSS, no
 * puntos literales en el texto — ver `CreditsScreen.module.scss`); la
 * estructura vive en el componente, cada etiqueta visible sale de i18n como
 * cualquier otro texto (mismo patrón que el guion fijo de
 * `conversation.ts` del nivel 11).
 */
export function CreditsScreen({ onBack }: CreditsScreenProps) {
  const t = useT()
  const author = t('credits.author')
  const roles = [
    { label: t('credits.roleGameDesign'), value: author },
    { label: t('credits.rolePixelArt'), value: author },
    // Código: a medias con Claude (Sofía quiso compartir el crédito de verdad, no de coña).
    { label: t('credits.roleCode'), value: t('credits.codeCredit') },
    { label: t('credits.rolePsychologicalWarfare'), value: author },
    { label: t('credits.inspiredByLabel'), value: t('credits.inspiredByValue') },
    { label: t('credits.specialAppearanceLabel'), value: t('credits.sansCredit') },
  ]

  return (
    <main className={styles['credits-screen']}>
      <Confetti />
      <div className={styles['credits-screen__window']}>
        <XPWindow
          title={t('credits.title')}
          scrollableContent
          fillHeight
          footer={
            <XPButton variant="neutral" onClick={onBack}>
              {t('credits.backButton')}
            </XPButton>
          }
        >
          <div className={styles['credits']}>
            <p>{t('credits.intro1')}</p>
            <p>{t('credits.intro2')}</p>
            <p>{t('credits.intro3')}</p>
            <p>{t('credits.intro4')}</p>

            <div className={styles['credits__divider']} />

            <div className={styles['credits__roles']}>
              {roles.map((role, index) => (
                <div key={index} className={styles['credits__row']}>
                  <span>{role.label}</span>
                  <span className={styles['credits__row-fill']} />
                  <span>{role.value}</span>
                </div>
              ))}
            </div>

            <p className={styles['credits__thanks-label']}>{t('credits.specialThanksLabel')}</p>
            <p>{t('credits.specialThanksTo')}</p>
            <p>{t('credits.specialThanksValue')}</p>

            <div className={styles['credits__divider']} />

            <p>{t('credits.dataJoke1')}</p>
            <p>{t('credits.dataJoke2')}</p>
            <p>{t('credits.dataJoke3')}</p>
            <p>{t('credits.dataJoke4')}</p>
            <p>{t('credits.dataJoke5')}</p>
            <p>{t('credits.dataJoke6')}</p>
            <p>{t('credits.dataJoke7')}</p>
          </div>
        </XPWindow>
      </div>
    </main>
  )
}
