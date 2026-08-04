# 017 · Pulido y QA transversal — Plan

## Enfoque

Ocho bloques con dependencias mínimas entre sí. Se hacen primero los que **cambian el build** (A y B), porque todo lo demás se verifica sobre el artefacto final; después los que dependen de **jugar** (D, E), que son los que más tiempo de juego consumen; y al final los de **cierre** (G, H). Regla de la feature: nada se da por bueno por deducción — cada criterio se comprueba sobre `dist/` o en el navegador.

## Implementación

1. **Playground fuera de producción** — el interruptor de arranque de `App.tsx` pasa a estar guardado por `import.meta.env.DEV`, de modo que el `import()` de `Playground` desaparece del grafo en el build (tree-shaking). El nivel de prueba sale del bundle por la misma vía (solo lo referencia la Playground). Verificación: `grep` sobre `dist/` buscando marcadores de ambos.
2. **`?dev` promovido a característica** — se elimina de la línea 017 del roadmap la retirada de `?dev` (la Playground sí se retira), se documenta en AGENTS.md como característica permanente y se comprueba que sigue operativo en el build de producción.
3. **Higiene del build** — `build.sourcemap: false` explícito en `vite.config.ts` (aunque sea el valor por defecto: explícito > implícito, porque es la fuga más grande); test/script de build que falla si `dist/` contiene `.map`, `.test.` o restos de la Playground; anotar en `tech-stack.md` la regla de los tests. Revisión de `dist/` con el desglose de chunks (bundle principal, `matter-*`, un chunk por nivel).
4. **Auditoría antiespoiler** — replicar el patrón del test del nivel 8 en:
   - **9**: que el DOM no distinga una casilla congelada de una normal más allá del botón visible.
   - **10**: que antes del sorteo las siete ventanas sean idénticas en marcado, y que después nada salvo el botón visible identifique a la elegida.
   - **12**: que `switchAt` y el contador de clics no aparezcan en el DOM ni en atributos (viven en refs).
5. **Mensaje de consola** — `src/app/consoleGreeting.ts`, llamado una vez al arrancar, con `console.log` y `%c` para estilarlo; texto en el tono del juego (inglés, es lo que espera quien abre DevTools). Incluye la pista de `?dev`. No se ejecuta en tests.
6. **Balanceo (D)** — sesión de juego completa sin `?dev`, con plantilla de notas por nivel (¿tiempo suficiente?, ¿muerte justa o arbitraria?, ¿se entiende el truco?). Los cambios resultantes se aplican como ajustes de constantes del GDD §14 + tests, nunca como cambios de mecánica.
7. **Audio (E)** — repaso guiado nivel a nivel con los interruptores en las cuatro combinaciones (música on/off × efectos on/off) y salida por las cuatro vías (victoria, derrota, X, recarga), vigilando especialmente el ducking del nivel 11.
8. **Responsive y accesibilidad (F)** — barrido con Playwright de las 5 anchuras sobre landing, selección, los 12 niveles, modales y créditos, con toques CDP en móvil; `prefers-reduced-motion` implementado con `@media` sobre las animaciones decorativas (veredicto, confeti, escritura del 11 → aparición instantánea del texto, manteniendo el bloqueo de input hasta que "terminaría"); repaso de foco visible y `aria-label`.
9. **Error boundary (G)** — componente propio alrededor del nivel activo en `LevelHost`, con una `XPDialog` de error y un botón de volver a la selección; probado forzando el fallo de un `import()` dinámico.
10. **README y metadatos (H)** — `README.md` **en español**, cuidado y con la voz *cute* del proyecto (corazón pixel de `ui/heart.png` y kaomoji como separadores de sección, con mesura: adornan, no sustituyen contenido). Estructura cerrada:
    1. **Título + gancho de una línea.**
    2. **Demo visual** — GIF de la app en acción (lo primero que se ve; pesa más que cualquier párrafo).
    3. **Por qué lo construí** — el porqué personal y el porqué técnico (borrador en progreso).
    4. **Stack.**
    5. **Funcionalidades** — bullets concretos y verificables ("12 niveles con mecánicas distintas: física con matter.js, tablero de flechas verificado formalmente, tragaperras…"), nunca genéricos tipo "sistema completo".
    6. **Instalación y ejecución local** — comandos copiar-pegar.
    7. **Estructura de carpetas** — árbol comentado, destacando `spec/` y `src/levels/`.
    8. **Decisiones técnicas interesantes** — 4–6 decisiones con su porqué (canal nivel→host, tablero del nivel 6 validado por script, un chunk por nivel, patrón imperativo para animaciones, resolución lógica + escala).
    9. **Cómo se construyó: SDD + Claude Code** — el método (spec → plan → tasks → código) enlazando `spec/`, y el uso de Claude Code con honestidad y proporción: se explica como decisión de proceso (qué se delegó, qué se revisó, qué reglas se le impusieron vía `AGENTS.md`), sin ocultarlo ni convertirlo en el tema central.
    10. **Roadmap / próximos pasos** — más niveles y orden aleatorio de niveles entre partidas, para que cada partida sea distinta.
    11. **Créditos e inspiración** — *Doki Doki Action Game* y "Sans © Toby Fox (Undertale) — homenaje sin ánimo de lucro".
    12. **Contacto** — LinkedIn (`https://www.linkedin.com/in/sofia-minaya/`), portfolio (`https://s-minaya.github.io/sofia-minaya-portfolio/`) y correo (`minaya.sofia@gmail.com`).
    
    Además: `<title>`, `<meta name="description">` y etiquetas Open Graph con imagen en `index.html`.
11. **Cierre documental** — repaso de GDD, constitución y las 17 features: coherencia con lo construido, casillas cerradas, roadmap completo.

## Decisiones

- **La Playground se retira solo del build, no del repo** — sigue siendo la herramienta para trabajar el sistema de diseño y el arnés del nivel de prueba; borrarla sería perder utillaje por estética. `import.meta.env.DEV` da exactamente el comportamiento pedido.
- **`?dev` se queda como secreto permanente** — deja de ser deuda técnica y pasa a ser característica documentada. Riesgo asumido y consciente: cualquiera que conozca el parámetro puede saltarse el juego; a cambio, queda disponible como herramienta útil y el proyecto gana un guiño.
- **Sourcemaps desactivados explícitamente** — es la diferencia real entre "minificado ilegible" y "todo el código fuente legible desde DevTools"; el único punto donde el antiespoiler sí tiene un efecto grande y barato.
- **No se persigue ofuscación** — contradiría el principio "el engaño es del juego, no del código" y sería una carrera perdida. Se documenta como decisión, no como olvido.
- **`prefers-reduced-motion` solo en lo decorativo** — reducir movimiento no puede cambiar las reglas de un nivel (sería un modo de dificultad accidental); afecta a veredicto, confeti y escritura, nunca a física, ciclos ni barajados.
- **Los archivos de test se verifican, no se asumen** — hoy quedan fuera del bundle por cómo funciona Vite, no por una decisión explícita; una comprobación automatizada convierte esa suerte en garantía.
- **README en español**  — el mercado objetivo es el tecnológico español y la voz del proyecto es la suya; podemos también hacer un `README.en.md` enlazado, que digan exactamente lo mismo.
- **El uso de Claude Code se cuenta, con proporción** — ni se esconde (sería deshonesto y hoy es una habilidad valorada) ni se convierte en el titular (el mérito es el método y las decisiones, no la herramienta). Se explica qué se delegó, qué se revisó y qué reglas se le impusieron; el crédito compartido de los créditos del juego es coherente con esto.
- **El error boundary llega ahora y no antes** — durante el desarrollo un fallo visible es información útil; en producción, con chunks cargándose por red desde Pages, es un riesgo real de pantalla en blanco.

## Riesgos

- **La feature se hace interminable** (ocho bloques, muchos de ellos manuales) — mitigación: los bloques son independientes y están ordenados por dependencia; si se alarga, se parte en `017` (build, antiespoiler, robustez) y `018` (balanceo, audio, accesibilidad, README) sin reordenar nada.
- **El balanceo abre la puerta a rediseñar niveles** — mitigación: "fuera de alcance" explícito; solo se tocan constantes del GDD §14.
- **Retirar la Playground rompe algo que dependía de ella sin saberlo** — mitigación: `npm run build` + partida completa tras el cambio, antes de seguir con el resto de bloques.
- **`prefers-reduced-motion` se cuela en la mecánica** (p. ej. desactivando animaciones que un nivel necesita) — mitigación: lista cerrada de tres animaciones afectadas; partida completa con la preferencia activada.
- **El README se queda en un esqueleto** — mitigación: es criterio de aceptación con contenido concreto (capturas, enlace, stack, SDD); es la pieza con más retorno de toda la feature para el objetivo del proyecto.
- **Los ajustes de dificultad rompen tests que fijaban valores** — mitigación: la regla de mantenimiento ya existente (GDD §14 + tests en el mismo cambio) se aplica en cada ajuste, no al final.
