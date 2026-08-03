# 016 · Nivel 12 — Accept All + créditos — Tareas

## Nivel 12

- [ ] Implementar `acceptAll.ts` (máquina pura: progreso, clics, fases `agree`/`trap`/`restored`, decaimiento, `switchAt` en [15,35] con el PRNG compartido) + tests (series largas sin llegar al 100 %, cambio exacto en `switchAt`, derrota en `trap`, restauración a los 2 s, pulsación justo en el límite en ambos sentidos).
- [ ] Conectar el reloj rAF de la casa a `tick(dt)`; congelable por `paused`, cancelable en cleanup.
- [ ] Implementar `Level12.tsx`: consentimiento en el marco (nodo memoizado); barra vía `useLevelBoard` (relleno por custom property escrita por ref, componente propio que se monta con el nodo); pie vía `useLevelFooter` con el Disagree fijo y el botón protagonista (variante y texto derivados de la fase, **sin `transition` de color**).
- [ ] Victoria: al pulsar en `restored`, bloquear input, animar la barra al 100 % (~400 ms) y llamar a `onWin()`.
- [ ] `touch-action: manipulation` en los botones (clic compulsivo en móvil sin zoom por doble toque).
- [ ] Sustituir el hueco 12 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.12.*` a ambos diccionarios.

## Créditos

- [ ] Implementar `CreditsScreen` (XPWindow sin contador ni X, `scrollableContent`, botón de volver) sustituyendo el placeholder del hueco `credits` de `AppShell`.
- [ ] Redactar `credits.*` en ES y EN a partir del GDD §10: felicitación troll, autoría (Sofía Minaya), inspiración (*Doki Doki Action Game*), homenaje ("Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro") y el remate del localStorage.
- [ ] Cablear el botón `Credits` de la modal de victoria del nivel 12 para navegar a `credits` en vez de a la selección.
- [ ] El botón de volver de los créditos llama a `resetRun()` y navega a la landing; el ranking conserva el récord con su marca `finished` (test).
- [ ] ✋ **Checkpoint con Sofía**: textos de los créditos en ambos idiomas (es su voz), ritmo de la barra y si la trampa cae bien jugando del tirón tras los once niveles anteriores.

## Cierre

- [ ] GDD: §14 con los parámetros nuevos (incremento por clic, decaimiento e intervalo, rango de `switchAt`, tiempo de restauración, duración del llenado final) y §10 con el crédito a Toby Fox junto al de Doki Doki.
- [ ] `paused` congela decaimiento, temporizador de 2 s e input; cleanup total al desmontar + test de no-fugas.
- [ ] QA: ganar parando a tiempo; perder cayendo en la trampa, por el Disagree fijo, por contador y por X; **recorrido completo landing → 12 niveles (con `?dev` para los previos) → créditos → landing → Empezar y comprobar que arranca una partida nueva desde el Nivel 1**; el ranking marca `finished` aunque no se lleguen a ver los créditos; `paused`; recarga a mitad; 5 anchos; móvil real con **toques CDP** (`Input.dispatchTouchEvent`, no `page.mouse`).
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
