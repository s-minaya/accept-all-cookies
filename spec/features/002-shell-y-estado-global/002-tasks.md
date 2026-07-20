# 002 · Shell y estado global — Tareas

- [x] Implementar `storage.ts` (claves versionadas, tolerancia a corrupción, degradación a memoria) + tests.
- [x] Implementar `settingsStore`, `rankingStore` y `runStore` (los tres con hidratación y persistencia; `runStore` incluye el contador del nivel activo) + tests de sus reglas (récord solo si mejora, reset no toca ranking, perder reinicia run por completo incluido el contador).
- [x] Crear `es.json` / `en.json` con los textos del shell (espacios de nombres `shell.*`) y las claves `game.*` (Agree, Disagree, Check, Stop, OK, Next, Yes, No — mismo valor en ambos idiomas), y el hook `useT()` con fallback a la clave.
- [x] Test que verifica que todas las claves `game.*` son idénticas en ES y EN.
- [x] Implementar `AudioManager` + `useAudio` con desbloqueo en el primer `pointerdown`.
- [x] Integrar los tres assets de audio definitivos en `src/assets/audio/`.
- [x] ✋ **Checkpoint con Sofía**: escuchar los tres audios en la playground y afinar el `musicVolumeFactor` (arranque: 0.15) y el volumen relativo de los efectos. — confirmado bien tal cual (0.15) el 2026-07-18; el 2026-07-20, tras oírlo ya desplegado en producción (en móvil), lo bajó dos veces (0.5, luego 0.1). Resultó ser un problema por dispositivo: quedó en `DESKTOP_MUSIC_VOLUME_FACTOR = 0.5` / `MOBILE_MUSIC_VOLUME_FACTOR = 0.1`, elegido por tipo de puntero.
- [x] Implementar `AppShell` con enrutado por estado y las 4 pantallas placeholder.
- [x] Definir `src/levels/types.ts` (contrato `LevelProps`, `LoseReason`) y `registry.ts` con `React.lazy`.
- [x] Implementar `LevelHost` (XPWindow + `useCountdown` con contador reanudable + X → derrota + Suspense + conexión con `runStore`).
- [x] Implementar el nivel de prueba (ganar / perder), con un timer y un listener internos para probar la limpieza. Temporalmente lanzado desde la pantalla de selección placeholder (ver decisión en `002-plan.md`); accesible solo desde la Playground a partir de la 005.
- [x] Test: al desmontar el nivel de prueba no quedan timers ni listeners vivos.
- [x] Verificar en la salida de `npm run build` que el nivel de prueba genera un chunk separado.
- [x] QA del recorrido completo (landing → selección → nivel → ganar/perder → selección) comprobando que solo hay una pantalla montada. Verificado con Playwright contra el dev server: sin errores/warnings de consola.
- [ ] QA en móvil real desde Pages: audio desbloquea bien, recarga conserva ajustes, ranking y la partida en curso (incluido el contador del nivel activo). **Pendiente de Sofía tras el despliegue** (requiere dispositivo físico).
- [x] Añadir a `AGENTS.md` la convención de espacios de nombres de i18n.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cada feature nueva que añada textos visibles debe añadir sus claves a **ambos** diccionarios (ES y EN) en el mismo cambio.
- [ ] Cualquier modificación de `LevelHost` o del contrato se re-valida con el nivel de prueba de la playground.
