# 005 · Nivel 1 — Essential Cookies — Tareas

- [x] Añadir `onRestart?` a `LevelProps`; implementar en `LevelHost` el remontaje por `key` + reinicio del contador; demostrarlo en el nivel de prueba (+ test).
- [x] Implementar `logic.ts` con `isAgreeVisible(timeLeft)` y la máquina `playing | errorDialog` + tests (incluido: en `paused` el plazo de 7 s no avanza).
- [x] Implementar `Level01.tsx`: texto de consentimiento, hueco reservado de Agree, Disagree → diálogo de error → OK → `onRestart()`; Agree → `onWin()`.
- [x] Estilos `level01.scss` en BEM con tokens compartidos.
- [x] Sustituir el hueco 1 del registro y verificar el chunk propio en el build.
- [x] Añadir las claves `levels.1.*` a ambos diccionarios (consentimiento + diálogo de error).
- [x] Edición manual del GDD (Sofía): en el Nivel 1, sustituir el bloque "Caso Agree" por: *"Caso Agree: se dispara el flujo estándar de Level Complete (GDD §7). El nivel no muestra ningún diálogo propio de victoria."*
- [x] ✋ **Checkpoint con Sofía**: revisar la estructura de la carpeta `level01/` como molde de los once niveles siguientes (nombres, reparto lógica/vista, SCSS) antes de cerrar. Confirmado: el texto dentro del marco azul y los botones en el pie de la ventana (fuera del marco, vía `useLevelFooter`) es el patrón que seguirán los niveles 2-12.
- [ ] QA: partida completa ganando y perdiendo (por contador y por X); diálogo de error abierto hasta que el contador llega a 0; Disagree pulsado muchas veces seguidas; 5 anchos; móvil real vía Pages.
  - Verificado por tests automatizados (Vitest + Testing Library, sin navegador real): victoria por Agree tras los 7s, derrota por contador y por X, diálogo de error con Disagree repetido, contador corriendo con el diálogo abierto hasta perder por tiempo, reinicio limpio tras OK.
  - Confirmado visualmente por Sofía: layout del recuadro de texto y botones.
  - Pendiente (no hay navegador disponible en esta sesión para verificarlo): los 5 anchos de referencia y el recorrido completo en móvil real vía Pages.
- [x] Validar contra los criterios de aceptación de `spec.md`: todos cumplidos salvo el de los 5 anchos de referencia, pendiente de verificación en dispositivo real por Sofía.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md` (pendiente de los 5 anchos / móvil real vía Pages).

## Mantenimiento (checklist recurrente)

- [ ] Si cambia el retardo de aparición del Agree (parámetro del GDD §14), actualizar GDD, lógica y tests en el mismo cambio.
