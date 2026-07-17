# 002 · Shell y estado global — Plan

## Enfoque

Construir de dentro hacia fuera: primero la capa de persistencia (`storage.ts`), sobre ella los stores, y sobre los stores el shell, el i18n y el audio. El contrato de nivel (`LevelComponent` + `LevelHost`) se hace al final, cuando ya existen el store y el shell que debe orquestar, y se valida con el nivel de prueba. Sin dependencias nuevas más allá de Zustand (ya aprobada en la constitución).

## Implementación

1. **`src/state/storage.ts`** — funciones `load<T>(key, fallback)` / `save(key, value)` con claves versionadas (`aac.v1.settings`, `aac.v1.ranking`), `try/catch` en parseo y escritura, y degradación a memoria si localStorage no está disponible. Tests con localStorage simulado y corrupto.
2. **Stores Zustand** — `src/state/settingsStore.ts`, `src/state/rankingStore.ts` (ambos hidratan desde `storage.ts` y persisten en cada cambio) y `src/state/runStore.ts` (solo memoria: `completedLevels`, `currentLevel`, acciones `completeLevel`, `resetRun`). Tests de las reglas: récord solo si mejora, reset no toca ranking.
3. **i18n** — `src/i18n/es.json`, `src/i18n/en.json` con claves con espacio de nombres (`shell.*`, `landing.*`, `level01.*`…), hook `useT()` que lee el idioma del `settingsStore` y hace fallback a la clave con `console.warn`.
4. **Audio** — `src/audio/AudioManager.ts` (singleton sobre `HTMLAudioElement`: `playPositive()`, `playNegative()`, `startMusic()`, `stopMusic()`, `setVolume()`) + hook `useAudio`. Desbloqueo en el primer `pointerdown` global (política de autoplay). Assets placeholder con licencia libre en `src/assets/audio/`.
5. **Shell** — `src/app/AppShell.tsx`: estado interno `screen` (`landing | select | level | credits`) y render exclusivo de la pantalla activa. Pantallas placeholder en `src/app/screens/`. Sin librería de rutas y sin reflejar nada en la URL.
6. **Contrato de nivel** — `src/levels/types.ts` (`LevelProps { onWin, onLose, timeLeft }`, `LoseReason`), `src/levels/registry.ts` (mapa `LevelId → React.lazy(import(...))`).
7. **`LevelHost`** — `src/app/LevelHost.tsx`: monta `XPWindow` (título del nivel vía i18n, contador con `useCountdown(100)`, X → `onLose('closed')`), `Suspense` con carga estilo XP, y conecta `onWin`/`onLose` con `runStore` y la navegación de vuelta a la selección.
8. **Nivel de prueba** — `src/levels/_test/`: dos `XPButton` (ganar / perder). Registrado solo para la playground, fuera del registro del juego real.
9. **Integración y QA** — recorrido completo con el nivel de prueba, verificación del chunk separado en el build, repaso de criterios.

## Decisiones

- **Enrutado por estado interno, sin URL** — no hay dependencia, es inmune a los límites de GitHub Pages y, de regalo, impide saltarse la progresión editando la URL (encaja con "no permite elegir nivel libremente" de la misión). Descartados: react-router (dependencia sin necesidad: 4 pantallas lineales) y hash routing (permitiría deep-links tramposos).
- **Un store por dominio** (settings / ranking / run) en lugar de un store único con slices — separa lo persistente de lo volátil de forma física, que es justo la distinción que más nos importa. Descartado: store único (mezclaría ciclos de vida distintos).
- **Claves de localStorage versionadas** (`aac.v1.*`) — si el esquema cambia en el futuro, se migra o se ignora limpiamente sin romper a quien ya jugó.
- **Persistencia inmediata en cada cambio** (settings/ranking) en vez de "guardar al salir" — son escrituras minúsculas y el evento `beforeunload` no es fiable en móvil.
- **Desbloqueo de audio en el primer `pointerdown`** — patrón estándar contra las políticas de autoplay; la música "empieza" lógicamente en la landing pero suena tras el primer toque.
- **El nivel de prueba vive en la playground, no se borra** — queda como herramienta permanente para probar el contrato cuando se toque `LevelHost`. Descartado: borrarlo en la 005 (perderíamos el arnés de pruebas manual).

## Riesgos

- **Políticas de autoplay más agresivas en iOS Safari** — mitigación: el desbloqueo se prueba en móvil real desde la URL de Pages (criterio de aceptación); si iOS exige interacción por elemento, se centraliza el desbloqueo en el `pointerdown` del botón de la landing.
- **Doble responsabilidad del contador** (el shell lo gestiona pero los niveles lo leen) — mitigación: `timeLeft` viaja como prop de solo lectura; ningún nivel recibe funciones de control del timer.
- **Fugas al desmontar niveles** — mitigación: criterio de aceptación con test específico; el nivel de prueba incluye un timer y un listener a propósito para verificar que la limpieza funciona.
- **Crecimiento desordenado de los diccionarios** — mitigación: convención de espacios de nombres fijada aquí y recogida en AGENTS.md al cerrar la feature.
