# 010 · Nivel 6 — Cross-Site Tracking — Tareas

- [ ] Copiar el tablero a `src/data/nivel6-tablero.json` + tests de datos: identidad con `spec/assets/` y validador con exit 0.
- [ ] Implementar `boardLogic.ts` (simulación pura, semántica del validador) + tests parametrizados contra la tabla del grafo de decisiones (24 combinaciones) y la solución completa.
- [ ] Implementar `pathAnimator.ts` (reproducción del camino a N casillas/s sobre rAF, congelable por `paused`, cancelable) + test con tiempo simulado.
- [ ] Implementar `cameraLogic.ts` (centrado + clamping, puro) + test.
- [ ] Implementar `Board.tsx`: grid desde el JSON + anillo decorativo + sprites/glifos placeholder (llave, candado cerrado/abierto, flechas) + ventana de cámara con transición suave.
- [ ] Implementar `Level06.tsx`: texto en el marco; tablero + panel de direcciones vía `useLevelBoard` (derecha en md+, debajo en xs/sm, ≥ 44 px) + flechas de teclado con cleanup; pie vía `useLevelFooter` (Agree deshabilitado→habilitado con el candado, nodo memoizado; Disagree → `failed`); sonido positivo al abrir el candado.
- [ ] Bloquear input durante cadenas; animar también los rebotes; ignorar movimientos hacia fuera del tablero.
- [ ] Cleanup total al desmontar (animador, teclado) + test de no-fugas; `paused` congela cadena, cámara e input.
- [ ] Sustituir el hueco 6 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.6.*` a ambos diccionarios.
- [ ] GDD §14: velocidad de cadena y transición de cámara; §2.3: sonido de candado si Sofía lo aprueba.
- [ ] ✋ **Checkpoint con Sofía**: sprites/glifos de llave, candado y flechas; velocidad de cadena sintiendo el castigo épico (D3-↑, 67 casillas) en vivo; legibilidad del tablero en su móvil.
- [ ] QA: ganar con la solución `→ ↓ → ↓ ↑ →`; perder por Disagree, contador y X; el castigo épico completo con la cámara siguiéndolo; recarga a mitad (llave al inicio) y con desenlace pendiente; `paused` en plena cadena; 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cualquier edición futura del tablero: modificar `spec/assets/nivel6-tablero.json`, pasar el validador, re-copiar a `src/data/` y actualizar la tabla del grafo en `nivel6-tablero.md` (los tests-oráculo la usan).
