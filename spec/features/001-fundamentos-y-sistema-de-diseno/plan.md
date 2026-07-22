# 001 · Fundamentos y sistema de diseño — Plan

## Enfoque

Scaffolding oficial de Vite (plantilla `react-ts`) con calidad desde el minuto uno (ESLint + Prettier + Vitest + React Testing Library), y construcción de fuera hacia dentro: primero tokens y fuentes (la base visual), luego `XPButton` (la pieza mejor definida del GDD y la más reutilizada), después ventana, diálogo, hooks y `GameArea`, y por último la playground que lo enseña todo y el despliegue a Pages. Cada pieza aterriza en la playground en cuanto existe, así la estética se valida con Sofía sobre la marcha y no al final.

## Implementación

1. **Scaffold del proyecto** — `npm create vite@latest` (react-ts), `tsconfig` estricto, ESLint + Prettier, Vitest + RTL. Configurar `base: '/<repo>/'` en `vite.config.ts`. Archivos: raíz del repo.
2. **Tokens y fuentes** — `src/styles/tokens.css` (todos los colores del GDD §2–3 como variables CSS + los 5 breakpoints), `src/styles/reset.css`, `@font-face` con las dos fuentes pixel autoalojadas en `src/assets/fonts/` (woff2). Verificar licencia ANTES de commitear los archivos de fuente.
3. **`XPButton`** — `src/components/xp/XPButton/` (componente + CSS Module). Variantes agree/disagree/neutral, 4 estados, bordes concéntricos, hundimiento al pulsar.
4. **`XPWindow`** — `src/components/xp/XPWindow/` con subcomponentes internos: barra de título (degradado, contador, título, botón X), recuadro de consentimiento con scroll interno, marco azul + interior beige del área de juego.
5. **`XPDialog`** — `src/components/xp/XPDialog/`, modal centrado sobre un overlay que deja ver el fondo.
6. **`useCountdown`** — `src/hooks/useCountdown.ts` + `useCountdown.test.ts` (timers falsos de Vitest).
7. **`usePointer`** — `src/hooks/usePointer.ts` con la lógica pura separada en `src/hooks/pointerLogic.ts` (+ test): clasificación tap/drag por umbral y detección de inmovilidad.
8. **`GameArea`** — `src/components/GameArea/`: mide su contenedor con `ResizeObserver` y aplica `transform: scale()` al lienzo lógico de 640×360.
9. **Playground** — `src/playground/`: una sección por componente/hook, con los textos reales del GDD como contenido de prueba (así se valida legibilidad de la fuente con contenido de verdad).
10. **Deploy** — `.github/workflows/deploy.yml`: build + publicación en GitHub Pages en cada push a `main`.
11. **QA responsive y táctil** — repaso de los 5 anchos + prueba en móvil real desde la URL de Pages; repaso final de los criterios del `spec.md`.

## Decisiones

- **Playground desplegada (no solo en dev)** — es la única forma de probar táctil y responsive en dispositivos reales sin construir nada más; será la página pública hasta que exista el shell del juego. Descartado: playground solo local (dejaba el deploy publicando una página vacía y sin pruebas en móvil real).
- **Fuentes**: UI → **DotGothic16** (pixel, evoca Tahoma/MS Sans); display → **Press Start 2P**. Ambas OFL-1.1, autoalojadas (sin CDN), legibles en 375 px.
- **`transform: scale()` en GameArea** en lugar de media queries dentro de cada nivel — un único sistema de coordenadas para todas las mecánicas (física, plinko, tablero). Descartado: CSS por breakpoint en cada nivel (multiplicaría por 12 el coste y la fragilidad).
- **Factor de escala libre** (no solo múltiplos enteros) para aprovechar la pantalla; con `image-rendering: pixelated` el desenfoque es asumible. Reversible: si en QA se ve mal, se cambia a factores enteros tocando solo `GameArea`.
- **Hover solo bajo `@media (hover: hover)`** — evita el estado hover "pegado" tras un toque en pantallas táctiles.
- **`100dvh` en lugar de `100vh`** — las barras dinámicas de los navegadores móviles rompen `100vh`.

## Riesgos

- **Fuente pixel ilegible en móvil pequeño** — mitigación: la playground usa textos reales del GDD desde el paso 9 y se prueba en 375 px pronto; hay fuente candidata alternativa.
- **Gestos nativos del navegador interfieren con los arrastres** (scroll, pull-to-refresh) — mitigación: `touch-action: none` en las zonas de juego y prueba en iOS Safari y Android Chrome desde esta feature.
- **Deploy roto por el `base` de Vite** — mitigación: es criterio de aceptación explícito; se verifica con el primer push, no al final.
- **Sobre-ingeniería del sistema de diseño** — mitigación: limitarse estrictamente a lo que definen GDD §3–4; cualquier variante nueva se añade cuando un nivel la necesite (regla de la constitución: extender con props, no anticipar).
