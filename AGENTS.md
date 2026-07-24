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
- Cada nivel es un módulo autocontenido en `src/levels/levelNN/` que respeta el contrato `LevelComponent` — definición completa en tech-stack.md (Modelo de datos): onWin/onLose/timeLeft (solo lectura)/paused/onRestart?, y los botones inferiores se publican con useLevelFooter(nodo) con el nodo SIEMPRE memoizado (una referencia nueva por render entra en bucle con LevelHost — ya pasó en la 005). Un nivel nunca navega ni toca el progreso directamente.
- **Ningún texto visible hardcodeado** (todo por i18n ES/EN) y **ningún color hardcodeado** (todo por tokens CSS). Excepción de diseño: las claves game.* (Agree, Disagree, Check, Stop, OK, Yes, No, más los títulos Cookies Accepted/Disagree del veredicto) tienen el MISMO valor en ambos diccionarios y un test lo verifica — NUNCA las traduzcas (GDD §11). Ojo: botones de navegación como Next o Return to Level Selection NO son game.* — se traducen con normalidad (viven en `meta.*`).
- Convención de claves i18n: shell.* (pantallas del shell: shell.select.*, shell.level.*…), landing.* (toda la landing y sus modales), meta.* (veredictos y ventanas de fin de nivel), levels.N.* (textos de cada nivel, p. ej. levels.1.*) y game.* (términos del falso SO, nunca traducidos). Cada feature añade sus claves a ambos diccionarios en el mismo cambio. El nivel de prueba (src/levels/_test/) es la única excepción: no usa useT() a propósito, para no importar del store.
- localStorage solo desde `src/state/storage.ts`.
- Entrada con Pointer Events vía el hook común `usePointer`; nada de eventos de ratón directos en los niveles. Hover siempre decorativo.
- Responsive mobile-first con los 5 breakpoints de tech-stack.md; áreas de juego con resolución lógica fija + escala. Un nivel no está terminado si no se supera con dedo y con ratón.
- Timers solo con el hook `useCountdown`; prohibidos `setInterval` sueltos.
- Componentes reutilizables: si un patrón visual aparece en 2+ sitios, vive en `src/components/` (`xp/`, `cute/` o el que corresponda a su lenguaje visual).
- Código (identificadores, nombres de archivo) en inglés; **comentarios en español**. Documentación de `spec/` en español. Los mensajes de commit siempre en inglés.
- **Estilos en Sass (`.module.scss`) con BEM**: bloque `.block`, elemento `.block__element`, modificador `.block--modifier`, siempre en inglés y descriptivos (kebab-case). Nada de estilos en línea salvo valores calculados en tiempo de ejecución que no puedan ser una clase — y aun así, solo la custom property CSS va en línea, no la propiedad final (ver tech-stack.md).

## Contexto útil

- Despliegue: GitHub Pages → `base: '/<nombre-del-repo>/'` en `vite.config.ts` y enrutado por estado interno, sin URL — el único parámetro válido es el escape `?playground` (nunca rutas de servidor).
- El Playground (`?playground`) es un escape intencional para probar el sistema de diseño fuera del flujo del juego, no algo que "limpiar"; todo componente nuevo del sistema de diseño se añade ahí en el mismo cambio en que se crea. QA de navegador (visual, responsive, interacción) se hace con Playwright — ver tech-stack.md.
- El tablero del nivel 6 (`spec/assets/nivel6-tablero.json`) está verificado: solución única `→ ↓ → ↓ ↑ →`. No lo modifiques sin volver a pasar el validador.
- Todos los assets de Sofía son definitivos y están en `src/assets/`: sonidos positivo/negativo, música de fondo (multiplicador propio de volumen, distinto en escritorio y móvil — ver `DESKTOP_MUSIC_VOLUME_FACTOR`/`MOBILE_MUSIC_VOLUME_FACTOR` en `src/audio/AudioManager.ts`), fondo de la landing (`landing-bg.png` escritorio ≥1025px / `landing-bg-mobile.png` móvil y tablet), 4 personajes, el Clippy del nivel 11, el corazón del `CuteButton`, los 4 iconos de la esquina de la landing, el icono de volver y el icono de check (`src/assets/images/ui/`: `back.png`, `check.png`). PNG pixel art: no recomprimir ni convertir a JPEG
