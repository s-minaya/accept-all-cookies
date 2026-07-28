# 009 · Nivel 5 — Social Media (tragaperras) — Tareas

- [ ] Extraer el PRNG a `src/utils/prng.ts` y reimportarlo desde `spawner.ts` (tests del nivel 4 en verde antes de seguir).
- [ ] Implementar `reels.ts` (tira cíclica ~40 % Agree, semilla, garantía de al menos un Agree y un Disagree) + tests.
- [ ] Implementar `slotMachine.ts` (estados por rodillo y fase global, encaje offset→índice con test de bordes, evaluación de triple Agree, fase `respinPause` con sus tests: pausar durante la pausa, contador muriendo durante la pausa) + tests.
- [ ] Implementar `Reel.tsx` (tira duplicada, rAF con velocidad base + desfase, marcador de fila central, transform por custom property).
- [ ] Implementar `Level05.tsx`: texto en el marco; tablero (3 rodillos + 3 Stops neutros, deshabilitado=oscurecido) vía `useLevelBoard` + `fillHeight`; sonidos al parar según resultado; `onWin()` con triple Agree; rehabilitación tras la pausa.
- [ ] Cleanup total al desmontar (rAF y pausa) + test de no-fugas; `paused` congela rodillos, pausa, Stops y sonidos.
- [ ] Sustituir el hueco 5 del registro (sin `consentKey`); verificar chunk propio y que matter.js NO está en este chunk.
- [ ] Añadir `levels.5.*` a ambos diccionarios.
- [ ] GDD: sustituir los mensajes de derrota propios del nivel 5 por la nota de flujo estándar (patrón del nivel 1) y añadir a §14: velocidad base, desfase entre rodillos, casillas por tira, pausa de rehabilitación.
- [ ] ✋ **Checkpoint con Sofía**: tacto de la tragaperras (velocidad, legibilidad en movimiento, encaje al parar, duración de la pausa de rehabilitación) y dificultad jugando en escritorio y su móvil.
- [ ] QA: partida entera ganando y perdiendo (contador con rodillos girando, contador muriendo en plena pausa de rehabilitación, X); Stops deshabilitados no repulsables; recarga a mitad y con desenlace pendiente; 5 anchos (3 rodillos en 375 px sin scroll horizontal); móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si se ajusta velocidad, proporción o pausa, actualizar GDD §14 y los tests afectados en el mismo cambio.
