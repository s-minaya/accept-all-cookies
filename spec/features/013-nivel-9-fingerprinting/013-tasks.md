# 013 · Nivel 9 — Fingerprinting — Tareas

- [ ] Implementar `cell.ts` (máquina pura por casilla: vacía → subiendo → congelada → saliendo; congelar arma la casilla si está vacía; descongelar reanuda) + tests.
- [ ] Implementar `spawner.ts` (intervalos aleatorios por casilla, tipo 50/50, PRNG compartido) + tests de distribución e independencia.
- [ ] Implementar el reloj único sobre rAF (delta acumulado para las 12 casillas, congelable por `paused`, cancelable) + test con tiempo simulado.
- [ ] Detección de inmovilidad sobre `usePointer` (extendiendo el hook si hace falta, nunca reimplementándolo en el nivel): quieto ~1 s congela la casilla apuntada; movimiento > 8 px descongela.
- [ ] Equivalente táctil: mantener pulsado congela; `pointerup` sobre botón congelado = pulsarlo; `pointerup` sin congelado = nada; arrastrar fuera antes de levantar = nada. Ruta de acción única (sin doble disparo) + test.
- [ ] Implementar `Level09.tsx` (texto en el marco, publica la cuadrícula) y `Level09Grid.tsx` (12 casillas con `overflow: hidden`, botones reales posicionados por custom property escrita por ref; el componente que posiciona es el que se monta).
- [ ] Estilos `Level09.module.scss`: rejilla 4×3 (md+) / 3×4 (xs/sm), casilla con altura para un botón entero, área táctil ≥ 44 px.
- [ ] Congelación en la parte alta de la casilla (constante `FROZEN_PROGRESS`), para que el botón se lea con el dedo encima.
- [ ] `paused` congela movimientos, apariciones, temporizador de inmovilidad e input; cleanup total al desmontar + test de no-fugas.
- [ ] Sustituir el hueco 9 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.9.*` a ambos diccionarios.
- [ ] GDD: §14 con los parámetros nuevos (intervalo de aparición, duración del recorrido, tiempo de inmovilidad, posición de congelación) y §15.2 precisando el equivalente táctil final.
- [ ] ✋ **Checkpoint con Sofía**: velocidad de los botones (imposible pero no injusta), tiempo de inmovilidad, y **que el botón congelado se lea con el dedo encima en su móvil**; decidir si hay sonido al congelar (por defecto: no, delataría la mecánica).
- [ ] QA: ganar con un Agree congelado y (si se logra) con uno en movimiento; perder con Disagree congelado y con Disagree en movimiento; solo se congela la casilla apuntada; descongelar al mover; `paused` con una casilla congelada; recarga a mitad y con desenlace pendiente; 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
