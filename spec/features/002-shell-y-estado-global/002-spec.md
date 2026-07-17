# 002 · Shell y estado global

**Estado:** propuesta

## Qué hace

Construye el esqueleto invisible del juego: todo lo que las pantallas y los niveles necesitan para existir, sin contenido real todavía.

- **Enrutado de pantallas**: el shell navega entre `landing → selección de niveles → nivel → créditos` montando **exclusivamente** la pantalla activa. En esta feature las pantallas son placeholders con lo mínimo para navegar; su contenido real llega en las features 003, 004 y 016.
- **Estado global (Zustand)** en tres dominios:
  - `settings` — idioma, volumen, música on/off. **Persiste** entre sesiones.
  - `ranking` — récord histórico por usuario (nombre, personaje, nivel máximo, fecha). **Persiste** entre sesiones y sobrevive a los Game Over.
  - `run` — partida en curso (niveles completados, nivel actual). **Solo en memoria**: recargar la página vuelve a la landing.
- **`storage.ts`**: el único módulo del proyecto que toca localStorage, con claves versionadas y tolerante a datos corruptos.
- **i18n ES/EN**: diccionarios propios + hook `useT()`. Cambiar el idioma en caliente actualiza todos los textos visibles. Esta feature carga los textos del shell; cada feature posterior añade sus propias claves.
- **Audio**: reproductor con los 3 assets del GDD (sonido positivo, sonido negativo, música de fondo en loop), obedeciendo el volumen y el interruptor de música de `settings`, y compatible con las políticas de autoplay de los navegadores (la música arranca tras la primera interacción del usuario).
- **Contrato `LevelComponent` + `LevelHost`**: la pieza central de esta feature. `LevelHost` monta la `XPWindow` común (título, contador de 100 s, botón X), carga el nivel activo con `React.lazy` (un chunk por nivel) y le pasa el contrato: `onWin()`, `onLose(reason)` y el tiempo restante. El X y el contador a 0 disparan la derrota **desde el shell**, no desde el nivel.
- **Nivel de prueba**: un nivel trivial (dos botones: uno gana, otro pierde), accesible solo desde la playground, que valida el contrato completo de punta a punta. No forma parte del juego real.

## Por qué

Es la frontera entre "componentes bonitos" (001) y "un juego" (003+). Los 12 niveles van a apoyarse en este contrato: si `LevelHost`, el store y la carga perezosa quedan bien definidos ahora, cada nivel será solo "su mecánica"; si quedan mal, el error se multiplica por doce. Además fija desde ya las dos garantías de la constitución que más afectan al rendimiento: un solo nivel montado a la vez y un chunk por nivel.

## Criterios de aceptación

### Navegación y montaje
- [ ] Se puede navegar landing → selección → nivel de prueba → (ganar/perder) → selección, y en todo momento solo la pantalla activa está montada en el DOM.
- [ ] Al recargar la página, el juego vuelve a la landing; los ajustes y el ranking se conservan, la partida en curso no.
- [ ] La URL no permite saltar a pantallas o niveles arbitrarios.

### Estado y persistencia
- [ ] Completar el nivel de prueba marca el progreso en `run`; perderlo reinicia `run` por completo (tests).
- [ ] El ranking solo se actualiza cuando un usuario supera su propio récord, y nunca se borra al perder (tests).
- [ ] `storage.ts` es el único archivo que contiene `localStorage` (verificable con un `grep`).
- [ ] Con localStorage corrupto (JSON inválido) o deshabilitado (modo privado), el juego arranca igualmente con valores por defecto, sin pantallazo de error.

### i18n
- [ ] Cambiar el idioma actualiza todos los textos del shell al instante, sin recargar.
- [ ] Una clave inexistente no rompe la app: se muestra la propia clave y se avisa por consola.

### Audio
- [ ] El sonido positivo y el negativo suenan bajo demanda; la música entra en loop tras la primera interacción del usuario, sin errores de autoplay en consola.
- [ ] El volumen de `settings` afecta a los tres assets y el interruptor de música la detiene y la reanuda.

### Contrato de nivel
- [ ] El nivel de prueba se carga con `React.lazy` y aparece como chunk separado en la salida de `npm run build`.
- [ ] Dentro de `LevelHost`, el contador arranca en 100 y desciende; llegar a 0 dispara `onLose('timeout')` y pulsar la X dispara `onLose('closed')` — ambos gestionados por el shell, no por el nivel.
- [ ] El nivel de prueba no importa nada del store ni navega: solo usa el contrato (verificable revisando sus imports).
- [ ] Al desmontar el nivel de prueba no quedan timers ni listeners vivos (test).

## Fuera de alcance

- Contenido real de landing, ranking visual y ajustes visuales → **feature 003**.
- Pantalla de selección real, animaciones AGREE/DISAGREE y ventanas de Game Over / Level Complete → **feature 004** (aquí, ganar o perder simplemente devuelve a la pantalla de selección placeholder).
- Los 12 niveles reales → features 005–016.
- Textos de los niveles en los diccionarios → cada feature de nivel añade los suyos.
- Assets de audio definitivos → ver checkpoint en `tasks.md`; esta feature puede usar placeholders con licencia libre.
