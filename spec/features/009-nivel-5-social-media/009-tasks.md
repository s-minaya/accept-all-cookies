# 009 · Nivel 5 — Social Media (tragaperras) — Tareas

- [x] Extraer el PRNG a `src/utils/prng.ts` y reimportarlo desde `spawner.ts` (tests del nivel 4 en verde antes de seguir).
- [x] Implementar `reels.ts` (tira cíclica ~40 % Agree, semilla, garantía de al menos un Agree y un Disagree) + tests.
- [x] Implementar `slotMachine.ts` (estados por rodillo y fase global, encaje offset→índice con test de bordes, evaluación de triple Agree, fase `respinPause` con sus tests: pausar durante la pausa, contador muriendo durante la pausa) + tests.
- [x] Implementar `Reel.tsx` (tira triplicada — sube de duplicada tras corregir la dirección de giro, ver más abajo —, rAF con velocidad base + desfase, marcador de fila central, transform por custom property).
- [x] Implementar `Level05.tsx`: texto en el marco; tablero (3 rodillos + 3 Stops neutros, deshabilitado=oscurecido, mismo ancho que su rodillo) vía `useLevelBoard`; `coin.mp3` en cada captura (corregido: sonaba positivo/negativo por símbolo, ahora un único sonido de "moneda" para cualquier captura); `onWin()` con triple Agree, `onLose()` inmediato con triple Disagree (excepción explícita a la rehabilitación); rehabilitación tras la pausa. Sin `fillHeight`: cada rodillo tiene su propia altura fija, no lo necesita (mismo razonamiento que llevó a quitárselo al nivel 4). Estilo visual retocado tras revisión contra una referencia: borde azul oscuro en cada rodillo, barra que cruza los 3 a media altura, marcador central gris de esquinas redondeadas, botones Agree/Disagree en forma de píldora con margen creciente por breakpoint entre ellos.
- [x] Cleanup total al desmontar (rAF y pausa) + test de no-fugas; `paused` congela rodillos, pausa, Stops y sonidos.
- [x] Sustituir el hueco 5 del registro (sin `consentKey`); verificar chunk propio y que matter.js NO está en este chunk.
- [x] Añadir `levels.5.*` a ambos diccionarios.
- [x] GDD: sustituir los mensajes de derrota propios del nivel 5 por la nota de flujo estándar (patrón del nivel 1), añadir a §14 (velocidad base, desfase entre rodillos, casillas por tira, pausa de rehabilitación) y documentar la excepción de triple Disagree como derrota inmediata (decisión tomada en el checkpoint, contradecía el borrador de `009-spec.md` frente al GDD original — corregido en ambos para que coincidan).
- [x] ✋ **Checkpoint**: tacto de la tragaperras, dirección de giro, estilo visual de los rodillos (revisado contra una referencia, varias rondas de ajuste) y sonido de captura — aprobado.
- [x] QA: cubierto por Playwright (partida entera ganando y perdiendo, contador muriendo en plena pausa de rehabilitación, X durante la pausa, Stops deshabilitados no repulsables, recarga a mitad, 5 anchos sin scroll horizontal, toque en emulación iPhone SE) + revisión visual directa sobre capturas reales.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si se ajusta velocidad, proporción o pausa, actualizar GDD §14 y los tests afectados en el mismo cambio.
