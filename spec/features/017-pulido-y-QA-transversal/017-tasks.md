# 017 · Pulido y QA transversal — Tareas

## A · Playground fuera de producción, `?dev` se queda

- [ ] Guardar el interruptor `?playground` de `App.tsx` con `import.meta.env.DEV` para que la Playground (y con ella el nivel de prueba) desaparezca del build de producción.
- [ ] Verificar sobre `dist/` que no queda ni rastro de la Playground ni del nivel de prueba, y que `npm run dev` la sigue sirviendo entera.
- [ ] Promover `?dev` a característica permanente: actualizar su línea en el roadmap (ya no se retira) y documentarlo en AGENTS.md; comprobar que funciona en el build de producción.

## B · Higiene del build

- [ ] `build.sourcemap: false` explícito en `vite.config.ts` y verificar que `dist/` no contiene `.map` ni referencias a ellos.
- [ ] Añadir a `tech-stack.md` la regla: los archivos de test viven en el repo y **nunca** en el bundle de producción.
- [ ] Comprobación automatizada del build que falle si `dist/` contiene `.map`, `.test.` o restos de la Playground.
- [ ] Revisar el desglose de chunks: bundle principal, `matter-*` compartido solo por los niveles 3 y 4, un chunk por nivel.

## C · Antiespoilers y consola

- [ ] Test de indistinguibilidad en el DOM para el nivel 9 (casilla congelada), el 10 (ventana con el Agree antes y después del sorteo) y el 12 (`switchAt` y contador de clics fuera del DOM), al estilo del que ya existe en el 8.
- [ ] Implementar el mensaje de consola (`consoleGreeting.ts`, `console.log` con `%c`, en el tono del juego, no en tests).
- [ ] El mensaje revela `?dev` como puerta secreta para programadores.

## D · Balanceo de dificultad

- [ ] ✋ **Sesión de Sofía**: partida completa sin `?dev`, de la landing a los créditos, anotando por nivel si el tiempo da, si las muertes se sienten justas y si el truco se entiende.
- [ ] Aplicar los ajustes acordados como constantes del GDD §14, actualizando GDD y tests en el mismo cambio (nunca cambios de mecánica).

## E · Audio

- [ ] Repaso nivel a nivel con las cuatro combinaciones de interruptores (música on/off × efectos on/off). Que si el usuario bloquea el teléfono, o cambia de página, o aplicación, la música se pare.
- [ ] Verificar que ninguna salida (victoria, derrota, X, recarga) deja audio sonando ni la música agachada — atención especial al ducking del nivel 11.
- [ ] Ajustar volúmenes relativos si algo desentona (música, positivo/negativo, `coin`, voz).

## F · Responsive y accesibilidad

- [ ] Barrido con Playwright de landing, selección, los 12 niveles, modales y créditos en 375 / 480 / 768 / 1280 / 1920, con toques CDP en los móviles.
- [ ] Foco visible y navegación por teclado en landing, selección, modales y créditos; `aria-label` verificado en todos los botones de solo icono.
- [ ] Implementar `prefers-reduced-motion` en veredicto gigante, confeti y escritura del nivel 11 (el bloqueo de input del 11 se mantiene aunque el texto aparezca de golpe); **ninguna regla de juego cambia**.
- [ ] Partida completa con `prefers-reduced-motion` activado para confirmar que nada mecánico se altera.

## G · Robustez

- [ ] Error boundary alrededor del nivel activo: si un chunk falla al cargar, mostrar una `XPDialog` de error con botón de volver a la selección; probarlo forzando el fallo del `import()`.
- [ ] Reverificar el arranque con `localStorage` vacío, corrupto y con datos de esquema antiguo.

## H · Cierre del proyecto

- [ ] Grabar el GIF de demo (partida real, unos segundos de varios niveles: rotación del 3, plinko del 4, tablero del 6).
- [ ] Escribir el `README.md` en español con las doce secciones acordadas (ver `plan.md`, paso 10), con la voz *cute* del proyecto: corazón pixel y kaomoji como separadores, sin recargar.
- [ ] ✋ **Sofía**: aprobar el texto de "Por qué lo construí" y el de "Cómo se construyó (SDD + Claude Code)" — son las dos secciones que hablan de ella, no del juego.
- [ ] Metadatos en `index.html`: `<title>`, descripción y Open Graph con imagen; verificar cómo se ve el enlace compartido.
- [ ] Sincronización documental final: GDD, constitución y las 17 features coherentes con lo construido; todas las casillas de checkpoint cerradas; roadmap con todo en "Hecho".
- [ ] ✋ **Checkpoint final de Sofía**: partida completa en su móvil real vía Pages y visto bueno al README y a los metadatos.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`. **Fin del proyecto.**
