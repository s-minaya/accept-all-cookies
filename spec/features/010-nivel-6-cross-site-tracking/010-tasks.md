# 010 · Nivel 6 — Cross-Site Tracking — Tareas

- [x] Copiar el tablero a `src/data/nivel6-tablero.json` + tests de datos: identidad con `spec/assets/` y validador con exit 0.
- [x] Implementar `boardLogic.ts` (simulación pura, semántica del validador) + tests parametrizados contra la tabla del grafo de decisiones (24 combinaciones) y la solución completa.
- [x] Implementar `pathAnimator.ts` (reproducción del camino a N casillas/s sobre rAF, congelable por `paused`, cancelable) + test con tiempo simulado.
- [x] Implementar `cameraLogic.ts` (centrado + clamping, puro) + test.
- [x] Implementar `Board.tsx`: grid desde el JSON + anillo decorativo + sprites/glifos placeholder (llave, candado cerrado/abierto, flechas) + ventana de cámara con transición suave.
- [x] Implementar `Level06.tsx`: texto en el marco; tablero + panel de direcciones vía `useLevelBoard` (derecha en md+, debajo en xs/sm, ≥ 44 px) + flechas de teclado con cleanup; pie vía `useLevelFooter` (Agree deshabilitado→habilitado con el candado, nodo memoizado; Disagree → `failed`); sonido positivo al abrir el candado.
- [x] Bloquear input durante cadenas; animar también los rebotes; ignorar movimientos hacia fuera del tablero.
- [x] Cleanup total al desmontar (animador, teclado) + test de no-fugas; `paused` congela cadena, cámara e input.
- [x] Sustituir el hueco 6 del registro; verificar chunk propio sin matter.js.
- [x] Añadir `levels.6.*` a ambos diccionarios.
- [x] GDD §14: velocidad de cadena y transición de cámara; §2.3: sonido de candado si Sofía lo aprueba.
- [x] ✋ **Checkpoint con Sofía**: sprites/glifos de llave, candado y flechas aprobados ("los iconos de las flechas y las llaves lo damos por valido"). Revisión de Sofía en móvil real detectó que la ventana producía scroll vertical (recuadro de texto + tablero fijo no cabían en móviles pequeños) — corregido con `compactConsentBox` (recuadro de texto más bajo solo en móvil, sin tocar tamaño del tablero/panel/iconos).
- [x] QA: ganar con la solución `→ ↓ → ↓ ↑ →`; perder por Disagree y por X (contador a 0 usa el mismo mecanismo genérico de `LevelHost`, ya cubierto de forma independiente del nivel); el castigo épico completo con la cámara siguiéndolo; recarga a mitad (llave al inicio, contador restaurado); `paused` en plena cadena (congela cámara e input); 5 anchos sin scroll horizontal; toque en emulación móvil; los 5 anchos de referencia (incluido 375×667, el más ajustado) sin scroll vertical tras el arreglo de `compactConsentBox`.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Cualquier edición futura del tablero: modificar `spec/assets/nivel6-tablero.json`, pasar el validador, re-copiar a `src/data/` y actualizar la tabla del grafo en `nivel6-tablero.md` (los tests-oráculo la usan).
