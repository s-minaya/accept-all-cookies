# AGENTS.md — Accept All Cookies

Juego web en React + TypeScript, 100% pixel art con estética Windows XP: 12 niveles con forma de banner de cookies donde la interfaz intenta impedirte pulsar Agree. Proyecto de Sofía Minaya, desarrollado con Spec Driven Development.

## Fuentes de verdad (leer antes de tocar nada)

1. `spec/README.md` — cómo funciona el flujo SDD de este repo.
2. `spec/constitution/mission.md` — qué es el proyecto y sus principios.
3. `spec/constitution/tech-stack.md` — stack, convenciones y límites duros (versión completa; lo de abajo es un resumen).
4. `spec/constitution/roadmap.md` — qué feature toca ahora.
5. `spec/assets/accept-all-cookies-gdd.md` — el GDD: TODO el diseño del juego (mecánicas, textos, colores, condiciones de victoria/derrota) sale de aquí.

## Flujo de trabajo (obligatorio)

- **No se escribe código sin feature.** Antes de implementar nada: `spec/features/NNN-nombre/` debe existir con `spec.md`, `plan.md` y `tasks.md` aprobados por Sofía.
- Trabaja sobre la feature marcada como "Siguiente" en el roadmap; al terminarla, muévela a "Hecho".
- Marca las tareas de `tasks.md` a medida que las completas.
- Si el código va a contradecir el GDD, PARA y pregunta: o se corrige el código o Sofía actualiza el GDD explícitamente. Nunca "interpretes" el GDD por tu cuenta.

## Comandos

- `npm run dev` — entorno local (Vite)
- `npm run test` — Vitest
- `npm run lint` — ESLint + Prettier
- `npm run build` — build de producción
- `node spec/tools/validate-level6.mjs` — valida el tablero del nivel 6 (obligatorio tras editarlo)

## Reglas duras (resumen de tech-stack.md)

- TypeScript estricto. Estado global con Zustand. Física solo con matter.js y solo en los niveles 3 y 4 (import dinámico dentro del chunk del nivel).
- **No añadir dependencias** sin actualizar antes `spec/constitution/tech-stack.md`.
- **Solo un nivel montado a la vez**: cada nivel se carga con `React.lazy` y se desmonta por completo al salir (limpiando física, timers y listeners). Nunca renderizar pantallas inactivas.
- Cada nivel es un módulo autocontenido en `src/levels/levelNN/` que respeta el contrato `LevelComponent` — definición completa en tech-stack.md (Modelo de datos): onWin/onLose/timeLeft (solo lectura)/paused/onRestart?. Publica hacia el shell a través del canal único `src/levels/hostChannel.ts` (ranuras `footer`, `windowTransform`, `windowZIndex`, `windowRef`, `titleBarRef`, `board`, `overlay` — añadir una ranura ahí antes que crear un hook/contexto nuevo suelto); los nodos que se publican van SIEMPRE memoizados (una referencia nueva por render entra en bucle con LevelHost — ya pasó en la 005). Un nivel nunca navega ni toca el progreso directamente, ni manipula la ventana común más allá de lo que el canal permite.
- **`useLevelFooter`/`useLevelBoard` montan su nodo un ciclo de render DESPUÉS que el propio nivel** (el nivel se renderiza, publica el nodo vía el canal, y solo entonces `LevelHost` lo monta de verdad en el árbol). Cualquier `ref`/`useLayoutEffect` que necesite leer ese nodo real (medir tamaño, posicionar, enganchar `usePointer`) tiene que vivir DENTRO de un componente propio que se monte junto con ese nodo — nunca en el nivel que lo publica, porque su efecto se dispararía antes de que el ref exista. Ya mordió en la 010 (tablero del nivel 6), la 011 (cubierta del nivel 7) y la 012 (cuadrícula del nivel 8, bug real: los 12 botones se quedaban apilados en el origen). Patrón de solución as-built: `Board.tsx` (010), `Level08Grid.tsx` (012) — el componente que posiciona/mide tiene que ser el mismo que se monta.
- **Ningún texto visible hardcodeado** (todo por i18n ES/EN) y **ningún color hardcodeado** (todo por tokens CSS). Excepción de diseño: dentro de game.*, SOLO Agree, Disagree y los títulos del veredicto que los reutilizan (Cookies Accepted, el propio Disagree como título de Game Over) tienen el MISMO valor en ambos diccionarios y un test lo verifica — NUNCA los traduzcas (GDD §11, mecánica de similitud visual). El resto de game.* (Check, Stop, OK, Yes, No) SÍ se traduce con normalidad (corregido tras revisión de Sofía sobre la 015) — game.* ya no implica "sin traducir" en bloque, solo agrupa vocabulario del falso sistema operativo. Ojo: botones de navegación como Next o Return to Level Selection NO son game.* — se traducen con normalidad (viven en `meta.*`).
- Convención de claves i18n: shell.* (pantallas del shell: shell.select.*, shell.level.*…), landing.* (toda la landing y sus modales), meta.* (veredictos y ventanas de fin de nivel), levels.N.* (textos de cada nivel, p. ej. levels.1.*), credits.* (pantalla de créditos, 016-plan.md — namespace propio, no shell.credits.*, por el volumen de bloques de texto que tiene) y game.* (términos del falso SO; ver la excepción de traducción arriba). Cada feature añade sus claves a ambos diccionarios en el mismo cambio. El nivel de prueba (src/levels/_test/) es la única excepción: no usa useT() a propósito, para no importar del store.
- localStorage solo desde `src/state/storage.ts`.
- Entrada con Pointer Events vía el hook común `usePointer`; nada de eventos de ratón directos en los niveles. Hover siempre decorativo.
- Responsive mobile-first con los 5 breakpoints de tech-stack.md; áreas de juego con resolución lógica fija + escala. Un nivel no está terminado si no se supera con dedo y con ratón.
- Timers solo con el hook `useCountdown`; prohibidos `setInterval` sueltos. Excepción: bucles de física/animación (`requestAnimationFrame`, `Runner` de matter.js) permitidos dentro de un nivel, con limpieza obligatoria en el cleanup (Runner parado, rAF cancelado, listeners desconectados) — `setInterval` sigue prohibido sin excepción.
- Componentes reutilizables: si un patrón visual aparece en 2+ sitios, vive en `src/components/` (`xp/`, `cute/` o el que corresponda a su lenguaje visual).
- Código (identificadores, nombres de archivo) en inglés; **comentarios en español**. Documentación de `spec/` en español. Los mensajes de commit siempre en inglés.
- **Estilos en Sass (`.module.scss`) con BEM**: bloque `.block`, elemento `.block__element`, modificador `.block--modifier`, siempre en inglés y descriptivos (kebab-case). Nada de estilos en línea salvo valores calculados en tiempo de ejecución que no puedan ser una clase — y aun así, solo la custom property CSS va en línea, no la propiedad final (ver tech-stack.md).

## Contexto útil

- Despliegue: GitHub Pages → `base: '/<nombre-del-repo>/'` en `vite.config.ts` y enrutado por estado interno, sin URL — los únicos parámetros válidos son los escapes `?playground` y `?dev` (nunca rutas de servidor).
- El Playground (`?playground`) es un escape intencional para probar el sistema de diseño fuera del flujo del juego, no algo que "limpiar"; todo componente nuevo del sistema de diseño se añade ahí en el mismo cambio en que se crea. Gateada por `import.meta.env.DEV` (017-plan.md, bloque A): sigue entera en `npm run dev`, pero desaparece del build de producción (con ella, el nivel de prueba — su único otro sitio, `registry.ts`, ya no lo necesita con los 12 niveles reales completos; se queda como arnés del contrato `LevelComponent` en `src/playground/LevelHostDemo.tsx`). QA de navegador (visual, responsive, interacción) se hace con Playwright — ver tech-stack.md.
- `?dev` (nivel 4, 008-plan.md) muestra un botón de saltar nivel al instante (sin veredicto ni modal), renderizado por `LevelHost` para los 12 niveles. **Característica permanente, no deuda técnica** (decisión de la 017: a diferencia de la Playground, sigue disponible también en producción): una puerta secreta para quien conozca el parámetro, documentada por el propio mensaje de consola (`consoleGreeting.ts`). No lo confundas con código muerto ni lo retires.
- El tablero del nivel 6 (`spec/assets/nivel6-tablero.json`) está verificado: solución única `→ ↓ → ↓ ↑ →`. No lo modifiques sin volver a pasar el validador.
- Todos los assets de Sofía son definitivos y están en `src/assets/`: sonidos positivo/negativo/moneda, música de fondo (multiplicador propio de volumen, distinto en escritorio y móvil — ver `DESKTOP_MUSIC_VOLUME_FACTOR`/`MOBILE_MUSIC_VOLUME_FACTOR` en `src/audio/AudioManager.ts`), fondo de la landing (`landing-bg.png` escritorio ≥1025px / `landing-bg-mobile.png` móvil y tablet), 4 personajes, el Clippy del nivel 11 (`sans.png` + `sans-voice.mp3`, ver `AudioManager.startVoiceLoop`/`duckMusic`), el corazón del `CuteButton`, los 4 iconos de la esquina de la landing, el icono de volver y el icono de check (`src/assets/images/ui/`: `back.png`, `check.png`). PNG pixel art: no recomprimir ni convertir a JPEG
