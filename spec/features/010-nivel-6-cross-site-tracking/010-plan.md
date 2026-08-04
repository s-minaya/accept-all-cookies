# 010 · Nivel 6 — Cross-Site Tracking — Plan

> Plan pre-implementación: describe el enfoque tal como se planeó antes de escribir código, no se ha mantenido sincronizado con ajustes posteriores (QA de juego, corrección de scroll vertical en móvil). Para el estado final as-built, ver `010-spec.md` y `010-tasks.md`.

## Enfoque

Determinista de punta a punta: primero la **simulación pura** (misma semántica que el validador, contrastada contra el grafo documentado), después el **animador de cadenas** (un recorrido precalculado que se reproduce a velocidad constante), y encima el render (grid + cámara + sprites). El tablero es un dato importado, nunca código: los dos tests de datos (identidad y validador) van antes que nada, porque blindan todo lo demás.

## Implementación

1. **Datos** — copiar `spec/assets/nivel6-tablero.json` a `src/data/nivel6-tablero.json`. Tests en `src/data/nivel6-tablero.test.ts`: (a) identidad byte a byte con la copia de `spec/assets/`; (b) `execSync('node spec/tools/validate-level6.mjs src/data/nivel6-tablero.json')` con exit 0.
2. **Simulación pura** — `src/levels/level06/boardLogic.ts` + tests: `simulate(grid, pos, dir)` → `{ tipo: 'blocked' | 'stop' | 'lock', camino: Celda[] }` con la semántica exacta del validador (paso a vacía = camino de 1; cadena = lista completa de casillas; rebote = ida y vuelta). Tests parametrizados contra la **tabla del grafo de decisiones** de `spec/assets/nivel6-tablero.md` (los 6 puntos × 4 direcciones: destino y longitud) + la solución completa.
3. **Animador de cadenas** — `src/levels/level06/pathAnimator.ts`: dado un `camino`, avanza la posición visible a N casillas/s con un acumulador sobre rAF (excepción de timers vigente); `paused` lo congela; cleanup cancela. Test con tiempo simulado.
4. **Cámara** — `cameraLogic.ts` (pura, + test): posición objetivo = llave centrada, con clamping a los bordes; el render la aplica como `translateX` con transición suave (custom property).
5. **Render del tablero** — `Board.tsx`: grid de celdas desde el JSON (vacías, flechas, llave, candado) + anillo decorativo gris; sprites/glifos placeholder pixel para llave, candado (cerrado/abierto) y flechas; la ventana de cámara recorta (`overflow: hidden`).
6. **Componente** — `Level06.tsx`: texto en el marco; tablero + panel de direcciones vía `useLevelBoard`; panel a la derecha (md+) / debajo (xs/sm) con los 4 botones neutros ≥ 44 px + listener de flechas de teclado (limpiado en cleanup); pie vía `useLevelFooter` con Agree (deshabilitado hasta el candado, nodo memoizado con esa dependencia) y Disagree (`failed`); sonido positivo único al abrir el candado.
7. **Registro e i18n** — hueco 6 sin `consentKey`; `levels.6.*` en ambos diccionarios.
8. **GDD** — §14: velocidad de cadena (casillas/s) y duración de la transición de cámara; nota del sonido de candado en §2.3 si se aprueba.
9. **QA** — partida entera ganando (la solución) y perdiendo (Disagree, contador, X); probar a propósito el castigo épico de D3-↑ (67 casillas, cámara siguiéndolo); recargas; `paused` en plena cadena; 5 anchos; móvil real vía Pages; ✋ checkpoint de sprites y de velocidad de cadena.

## Decisiones

- **La simulación se testea contra la tabla del grafo, no contra sí misma** — el documento de diseño ya declara el comportamiento esperado de las 24 combinaciones punto×dirección; usarlo como oráculo detecta cualquier divergencia entre la semántica del juego y la del validador. Descartado: tests ad hoc de casos sueltos (cobertura ilusoria).
- **El validador se ejecuta como test, no solo como script manual** — la invariante "no modificar el tablero sin validarlo" pasa de disciplina a CI; y el test de identidad evita que las dos copias del JSON deriven. Descartado: importar el JSON directamente desde `spec/` (mezclaría documentación y runtime en el build).
- **Recorrido precalculado + animador, en vez de simular tick a tick durante la animación** — la lógica decide todo el camino de golpe (puro, testeable) y la animación es solo reproducción; imposible que render y reglas discrepen. El input se bloquea mientras el animador tiene camino pendiente.
- **Cámara solo horizontal** — 7 filas + anillo caben de sobra en vertical en todos los breakpoints; una cámara 2D sería complejidad sin uso. Clamping puro con test.
- **Sonido positivo al abrir el candado** — el momento necesita un "¡clic!" de recompensa y el asset ya existe; adición mínima marcada como vetable en el checkpoint (no está en el GDD).
- **Placeholders pixel para llave/candado/flechas con checkpoint** — mismo trato que recibieron los personajes: los sprites son de Sofía; el nivel no se cierra sin su visto bueno o sus assets.
- **Velocidad de cadena única (~10 casillas/s) para avances, rebotes y castigos** — una sola constante que hace el castigo largo proporcionalmente doloroso (~7 s), como pide el diseño; si el playtesting lo quiere, se puede acelerar solo los castigos (segunda constante), pero no de salida.

## Riesgos

- **La semántica del juego diverge de la del validador** (dos implementaciones de las mismas reglas, TS y JS) — mitigación: el test-oráculo contra la tabla de 24 entradas + el test de la solución; cualquier divergencia rompe CI.
- **El castigo de 67 casillas aburre en vez de divertir** — mitigación: es un parámetro (velocidad de cadena) y hay checkpoint; la cámara siguiendo el paseo es parte del chiste — si aun así cansa, segunda constante solo-castigos.
- **Desorientación en móvil** (pocas columnas visibles) — mitigación: criterio explícito en 375 px; la cámara centrada + el anillo decorativo dan referencia; si hace falta, el tamaño de celda en xs se reduce un punto (más columnas visibles) sin bajar del táctil mínimo en los botones (que están fuera del tablero).
- **El listener de teclado se filtra a otras pantallas** — mitigación: montado/desmontado con el nivel, test de no-fugas ya estándar en la casa.
