# 005 · Nivel 1 — Essential Cookies — Tareas

- [ ] Añadir `onRestart?` a `LevelProps`; implementar en `LevelHost` el remontaje por `key` + reinicio del contador; demostrarlo en el nivel de prueba (+ test).
- [ ] Implementar `logic.ts` con `isAgreeVisible(timeLeft)` y la máquina `playing | errorDialog` + tests (incluido: en `paused` el plazo de 7 s no avanza).
- [ ] Implementar `Level01.tsx`: texto de consentimiento, hueco reservado de Agree, Disagree → diálogo de error → OK → `onRestart()`; Agree → `onWin()`.
- [ ] Estilos `level01.scss` en BEM con tokens compartidos.
- [ ] Sustituir el hueco 1 del registro y verificar el chunk propio en el build.
- [ ] Añadir las claves `levels.1.*` a ambos diccionarios (consentimiento + diálogo de error).
- [ ] Edición manual del GDD (Sofía): en el Nivel 1, sustituir el bloque "Caso Agree" por: *"Caso Agree: se dispara el flujo estándar de Level Complete (GDD §7). El nivel no muestra ningún diálogo propio de victoria."*
- [ ] ✋ **Checkpoint con Sofía**: revisar la estructura de la carpeta `level01/` como molde de los once niveles siguientes (nombres, reparto lógica/vista, SCSS) antes de cerrar.
- [ ] QA: partida completa ganando y perdiendo (por contador y por X); diálogo de error abierto hasta que el contador llega a 0; Disagree pulsado muchas veces seguidas; 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si cambia el retardo de aparición del Agree (parámetro del GDD §14), actualizar GDD, lógica y tests en el mismo cambio.
