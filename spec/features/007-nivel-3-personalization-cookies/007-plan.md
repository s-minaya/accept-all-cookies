# 007 · Nivel 3 — Personalization — Plan

## Enfoque

Tres frentes en orden de riesgo: (1) el **canal nivel→host consolidado** (toca el contrato: primero y con los niveles 1–2 en verde antes de seguir), (2) la **rotación + geometría del Agree** (lógica pura testeable antes de ponerle física), (3) la **lluvia con matter.js** (integración nueva, aislada en el chunk). La física se sincroniza con el DOM (los Disagrees son botones reales posicionados por transform), no con canvas: tienen que ser clicables y accesibles como cualquier botón.

## Implementación

1. **Canal nivel→host** — refactor de `src/levels/levelFooter.ts` a `src/levels/hostChannel.ts`: un único contexto con ranuras con nombre (`footer: ReactNode`, `windowTransform: string | null`). `useLevelFooter(nodo)` queda como envoltorio fino sobre la ranura `footer` (niveles 1–2 intactos); nuevo `useWindowRotation(deg)` publica la ranura `windowTransform`, que `LevelHost` aplica como custom property (`--window-rotation`) al elemento raíz de `XPWindow` (patrón de estilo en línea = solo la custom property, según tech-stack). Tests: las ranuras se publican/limpian al montar/desmontar; los tests de los niveles 1–2 siguen en verde.
2. **Lógica pura de rotación** — `src/levels/level03/rotationLogic.ts` + tests: ángulo del puntero respecto al centro (`atan2`), delta acumulado entre eventos de drag (cuidando el salto ±180°), y clasificación tap-vs-drag reutilizando `pointerLogic`.
3. **Geometría del Agree** — `src/levels/level03/agreeAnchor.ts` (pura, + tests): dado `{viewportW, viewportH, windowW, windowH}` devuelve eje de anclaje y distancia R:
   - Apaisado (`W > H`): anclaje bajo la ventana, `R` entre `H/2 + margen` y `W/2 − margen` (fuera por abajo a 0°, visible por los laterales a ~90°).
   - Vertical: anclaje lateral, `R` entre `W/2 + margen` y `H/2 − margen`.
   - Casi cuadrado (rango < 2·margen): se toma el punto medio del rango y se acepta que el Agree pueda asomar un borde a 0° (degradación documentada en la spec).
   - Se calcula **una vez al montar**; un resize a mitad de nivel no lo recoloca (caso raro; anotado en QA).
4. **Componente y rotación interactiva** — `src/levels/level03/Level03.tsx`: `usePointer` sobre la ventana (capturado en el contenedor de `LevelHost` vía el canal o listener propio del nivel sobre su raíz — decidir en implementación qué elemento captura, pero siempre a través de `usePointer`); publica `useWindowRotation(deg)`. El Agree se renderiza como hijo absoluto de la ventana en su sistema rotado, `overflow: visible` en la cadena de ancestros que haga falta.
5. **Física de la lluvia** — `src/levels/level03/rain.ts`: `import('matter-js')` dinámico; `Engine` + `Runner` propios del nivel; cuerpos rectangulares para ~25 Disagrees con spawn continuo y reciclaje (los que reposan demasiado tiempo se reutilizan arriba); paredes = el recuadro de lluvia. **Gravedad en coordenadas de pantalla**: en cada tick se fija `engine.gravity` al vector `(sin(−rot), cos(−rot))` (test puro de la transformación). Sincronización cuerpo→DOM por rAF con transform.
6. **Excepción de timers** — edición de `tech-stack.md` (y AGENTS.md): "bucles de física/animación (`requestAnimationFrame`, `Runner` de matter.js) permitidos dentro de los niveles **con limpieza obligatoria en el cleanup**; `setInterval` sigue prohibido". El cleanup del nivel para el Runner, cancela el rAF y destruye el Engine (test de no-fugas).
7. **Pie y registro** — pie con solo el Disagree fijo vía `useLevelFooter`; hueco 3 sustituido; `levels.3.*` en ambos diccionarios.
8. **`paused`** — detiene Runner y rAF, ignora input de rotación y clics; al reanudar, continúa.
9. **QA** — checkpoint de "tacto" con Sofía (velocidad de rotación percibida, densidad de lluvia, tamaño de los Disagrees clicables en móvil), partida completa ganando/perdiendo, recargas, 5 anchos con atención a 375 vertical y 1280 apaisado, móvil real vía Pages.

## Decisiones

- **Consolidar el canal en vez de un tercer hook suelto** — cumple la regla de freno de la 005: un mecanismo (contexto con ranuras) y envoltorios finos por necesidad, en vez de un contexto nuevo por feature. `useLevelFooter` no cambia de firma: los niveles 1–2 no se tocan. Descartado: `useLevelWindowTransform` como contexto independiente (dos mecanismos paralelos haciendo lo mismo).
- **Rota la ventana entera, aplicada por el shell** — la ventana pertenece a `LevelHost`; el nivel solo publica grados. Mantiene la propiedad intacta ("un nivel nunca manipula la ventana directamente") y la X/contador rotando gratis. Descartado: que el nivel envuelva su contenido en un div rotado (dejaría título/X/pie sin rotar, contra el GDD).
- **Gravedad en coordenadas de pantalla, no del recuadro** — es lo que hace creíble la rotación (giras y los botones caen en cascada) y sale casi gratis: un vector rotado por tick. Descartado: gravedad local fija (el recuadro giraría "con los botones pegados", matando el efecto).
- **Disagrees de la lluvia como botones DOM sincronizados con los cuerpos** — clicables, accesibles, con el estilo real de `XPButton` (o su versión mini con las mismas clases) sin duplicar estética en un canvas. Coste: sync por rAF, asumible con ≤25 cuerpos. Descartado: render en canvas (habría que reimplementar el botón XP a mano y el picking de clics).
- **Sin inercia en la rotación** — 1:1 puntero-ángulo es predecible, barato y suficiente; la inercia es tacto, no mecánica, y se decidirá con las manos en el checkpoint. Descartado de salida: física de rotación con fricción (complejidad sin evidencia de que aporte).
- **Geometría del Agree calculada al montar, no reactiva al resize** — el caso "giro la ventana del navegador a mitad de nivel" es marginal y recalcular en caliente teletransportaría el botón; perder por eso sería injusto. El contador de 100 s acota el problema.

## Riesgos

- **El refactor del canal rompe los niveles 1–2** — mitigación: es el paso 1, con la condición de que sus tests sigan en verde antes de continuar; `useLevelFooter` conserva firma y semántica exactas.
- **Rendimiento de la sync física→DOM en móviles modestos** — mitigación: población ≤25, transforms puros (sin layout), y el checkpoint en móvil real de Sofía antes de cerrar; si sufre, primer ajuste: bajar población (parámetro), segundo: reducir tasa de spawn.
- **El drag de rotación "roba" los taps o viceversa** — mitigación: un solo clasificador (el de `pointerLogic`, umbral 8 px) decide para toda la ventana; tests de ambos sentidos y QA táctil específico sobre Disagrees en movimiento.
- **El salto de ángulo en ±180° produce un brinco visual** — mitigación: delta angular normalizado a (−180°, 180°] en `rotationLogic` con test específico.
- **matter.js se cuela en el bundle principal** — mitigación: import dinámico dentro del chunk + criterio de build explícito.
- **Texto rotado ilegible/mareante en móvil** — no es bug sino diseño (es el chiste del nivel), pero el checkpoint de Sofía valida que la incomodidad sea la divertida y no la frustrante.
