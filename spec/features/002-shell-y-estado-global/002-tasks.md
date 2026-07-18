# 002 · Shell y estado global — Tareas

- [ ] Implementar `storage.ts` (claves versionadas, tolerancia a corrupción, degradación a memoria) + tests.
- [ ] Implementar `settingsStore`, `rankingStore` (con hidratación y persistencia) y `runStore` (solo memoria) + tests de sus reglas (récord solo si mejora, reset no toca ranking, perder reinicia run).
- [ ] Crear `es.json` / `en.json` con los textos del shell (espacios de nombres `shell.*`) y las claves `game.*` (Agree, Disagree, Check, Stop, OK, Next, Yes, No — mismo valor en ambos idiomas), y el hook `useT()` con fallback a la clave.
- [ ] Test que verifica que todas las claves `game.*` son idénticas en ES y EN.
- [ ] Implementar `AudioManager` + `useAudio` con desbloqueo en el primer `pointerdown`.
- [ ]  Integrar los tres assets de audio definitivos en `src/assets/audio/`.
- [ ] ✋ **Checkpoint con Sofía**: escuchar los tres audios en la playground y afinar el `musicVolumeFactor` (arranque: 0.15) y el volumen relativo de los efectos.
- [ ] Implementar `AppShell` con enrutado por estado y las 4 pantallas placeholder.
- [ ] Definir `src/levels/types.ts` (contrato `LevelProps`, `LoseReason`) y `registry.ts` con `React.lazy`.
- [ ] Implementar `LevelHost` (XPWindow + `useCountdown(100)` + X → derrota + Suspense + conexión con `runStore`).
- [ ] Implementar el nivel de prueba (ganar / perder) accesible solo desde la playground, con un timer y un listener internos para probar la limpieza.
- [ ] Test: al desmontar el nivel de prueba no quedan timers ni listeners vivos.
- [ ] Verificar en la salida de `npm run build` que el nivel de prueba genera un chunk separado.
- [ ] QA del recorrido completo (landing → selección → nivel → ganar/perder → selección) comprobando que solo hay una pantalla montada.
- [ ] QA en móvil real desde Pages: audio desbloquea bien, recarga conserva ajustes y ranking pero no la partida.
- [ ] Añadir a `AGENTS.md` la convención de espacios de nombres de i18n.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cada feature nueva que añada textos visibles debe añadir sus claves a **ambos** diccionarios (ES y EN) en el mismo cambio.
- [ ] Cualquier modificación de `LevelHost` o del contrato se re-valida con el nivel de prueba de la playground.
