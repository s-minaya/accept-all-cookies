# 005 · Nivel 1 — Essential Cookies — Plan

## Enfoque

Establecer la receta de carpeta de nivel que copiarán los once restantes: `src/levels/level01/` con la lógica en funciones puras (`logic.ts` + tests), el componente que solo pinta y delega, y los estilos SCSS en BEM. El retardo del Agree se **deriva del contador del shell** (nada de timers propios), y el reinicio se resuelve con el nuevo `onRestart` del contrato: el shell remonta el nivel con una `key` nueva y reinicia la cuenta atrás.

## Implementación

1. **Contrato** — añadir `onRestart?: () => void` a `LevelProps` (`src/levels/types.ts`). En `LevelHost`: manejarlo incrementando la `key` del nivel montado y reiniciando `useCountdown` a 100. Actualizar el nivel de prueba con un botón de reinicio para dejarlo demostrado (+ test).
2. **Lógica pura** — `src/levels/level01/logic.ts` + tests: `isAgreeVisible(timeLeft)` (visible cuando `100 − timeLeft ≥ 7`) y la mini-máquina del nivel (`playing | errorDialog`).
3. **Componente** — `src/levels/level01/Level01.tsx`: texto de consentimiento (`levels.1.*`) como contenido del marco azul (sin recuadro de consentimiento aparte, `consentKey` omitido); botones (hueco reservado para Agree + `XPButton` Disagree) publicados en el pie de la ventana vía `useLevelFooter` (`src/levels/levelFooter.ts`), nunca dentro del marco; al pulsar Disagree pasa a `errorDialog` y renderiza el `XPDialog` de error; OK → `onRestart()`. Pulsar Agree → `onWin()`.
4. **Estilos** — `Level01.module.scss` en BEM (`level-01__text`, `level-01__buttons`, `level-01__agree-slot`…), tokens compartidos, sin colores nuevos.
5. **Registro** — sustituir el hueco 1 por `React.lazy(() => import('./level01/Level01'))`.
6. **i18n** — claves `levels.1.*` (texto de consentimiento, título, mensaje y título del diálogo de error) en ES y EN. `OK` ya existe en `game.*`.
7. **GDD** — retocar el bloque del Nivel 1: eliminar el diálogo propio de victoria ("Caso Agree") en favor del flujo estándar (edición manual de Sofía, texto en tareas).
8. **QA** — partida completa ganando y perdiendo (contador y X), diálogo abierto hasta que el contador muere, 5 anchos, móvil real vía Pages.

## Decisiones

- **`isAgreeVisible` derivado de `timeLeft`** en lugar de un `setTimeout` propio — cero timers que limpiar, `paused` lo congela gratis y el reinicio lo resetea gratis (al remontar, `timeLeft` vuelve a 100). Descartado: timer interno (duplicaría la fuente de verdad del tiempo y fallaría con `paused`).
- **Reinicio por remontaje (`key`)** — "la ventana vuelve a aparecer desde el principio" es literalmente lo que hace React al remontar: estado interno limpio sin código de reset manual. Descartado: función `reset()` interna del nivel (cada nivel tendría que acordarse de resetear cada pieza de su estado; fuente clásica de bugs).
- **`onRestart` opcional en el contrato** — solo lo usan los niveles que lo necesitan; el resto ni lo declara. El timer sigue siendo de solo lectura para los niveles: el nivel *pide*, el shell *decide y ejecuta*.
- **El contador no se pausa durante el diálogo de error** — fiel al GDD (solo se reinicia al pulsar OK), más simple (cero estados intermedios de timer) y temáticamente cruel en el buen sentido.
- **El Agree ausente del DOM** (no `visibility: hidden`) — invisible también para el teclado y los lectores; imposible pulsarlo por accidente o con tab.
- **Botones inferiores fuera del marco vía `useLevelFooter`** (ajuste visual tras revisión de Sofía) — el GDD ya distinguía "área de juego" (marco azul) de "botones inferiores" (pie de ventana, §4.4/§4.5); el nivel 1 no tiene tablero, así que su texto ocupa el marco y sus botones necesitaban un sitio fuera de él. Se resolvió con un hook (`useLevelFooter`) que publica el nodo de botones del nivel en el `footer` de `XPWindow` vía contexto, en vez de que cada nivel intente maquetar su propio pie fuera de su árbol de children. El nodo debe ir memoizado: pasar una novedad de JSX en cada render (el contador cambia cada segundo) entra en bucle con el estado del footer en `LevelHost` — se descubrió y arregló junto con una causa relacionada (`useT()` no memoizaba su función de traducción).

## Riesgos

- **Segundo cambio de contrato en dos features** — mitigación: es opcional y aditivo (nada existente se toca); regla a partir de aquí: todo cambio de contrato exige actualizar el nivel de prueba y `tech-stack.md` en el mismo cambio. Si un tercer nivel pide otra ampliación, se replantea el contrato en conjunto antes de añadir más parches.
- **El jugador pulsa donde va a aparecer el Agree justo cuando aparece** (clic fantasma) — mitigación: el hueco reservado no es clicable antes de los 7 s y el botón aparece sin animación de desplazamiento; se comprueba en QA táctil que no hay toques fantasma.
- **Desincronización del texto del diálogo entre idiomas** — mitigación: claves en ambos diccionarios en el mismo cambio (regla de mantenimiento de la 002) y repaso en el checkpoint de QA.
- **La receta de carpeta sale torcida y se copia once veces** — mitigación: revisión explícita de Sofía de esta estructura antes de cerrar la feature (checkpoint en tareas); es más barato corregir el molde ahora.
