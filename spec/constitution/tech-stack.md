# Tech stack y convenciones

> Decisiones cerradas: TypeScript estricto, Zustand, matter.js y GitHub Pages.

## Tecnologías

- **Lenguaje:** TypeScript estricto (`strict: true`).
- **Framework / build:** React 18 + Vite.
- **Estado global:** Zustand (store pequeño: run, settings, ranking). Instalado en la feature 002 (`^5.0`).
- **Física (solo niveles 3 y 4):** matter.js, importado dinámicamente dentro del chunk del nivel para no cargar en el resto del juego. Instalado en la feature 007 (`matter-js` `^0.20`, `@types/matter-js` como devDependency); se importa con `import * as Matter from 'matter-js'` (el paquete tipa con `export =`, sin `esModuleInterop`).
- **Estilos:** Sass (`.module.scss`) + CSS Modules + variables CSS globales (tokens). Convención de clases BEM (ver Convenciones). Instalado en la feature 003 (`sass` `^1.101`, sin configuración extra: Vite lo detecta solo). Sin Tailwind ni styled-components.
- **i18n:** diccionarios JSON propios (`es.json`, `en.json`) + hook `useT()`. Sin librería.
- **Audio:** wrapper propio sobre `HTMLAudioElement` (3 assets: positivo, negativo, música en loop).
- **Tests:** Vitest + React Testing Library. La lógica de cada nivel (condiciones de victoria/derrota, máquinas de estados) vive en funciones puras testeables sin DOM. **Playwright** (instalado durante la feature 002, usado en las features 002-005) para QA visual/responsive/de interacción real contra el servidor de desarrollo — no sustituye a Vitest, lo complementa donde el DOM simulado no basta (animaciones, layout en distintos anchos, entrada táctil). `src/test/setup.ts` rellena huecos de jsdom que no afectan a un navegador real: sin esto, `HTMLMediaElement.play/pause`, la captura de puntero (`setPointerCapture` y compañía) y el propio `PointerEvent` (jsdom no lo implementa) lanzarían "Not implemented" al simular audio o arrastres en los tests.
- **Despliegue:** GitHub Pages, build estática publicada con GitHub Actions en cada push a `main`. Implicaciones: configurar `base: '/<nombre-del-repo>/'` en `vite.config.ts` (si no, los assets 404ean en Pages) y usar enrutado por estado interno, sin URL — el único parámetro válido es el escape `?playground` (Pages no reescribe URLs).
- **Herramienta de desarrollo:** OpenCode. El archivo `AGENTS.md` de la raíz debe apuntar a `spec/` como fuente de verdad y resumir los límites duros de este documento.

## Archivos / módulos clave

- `spec/` — esta documentación. `spec/assets/accept-all-cookies-gdd.md` es el GDD (fuente de verdad del diseño).
- `src/app/` — shell de la aplicación: enrutado de pantallas (landing / selección / nivel / créditos) y layout raíz.
- `src/components/xp/` — sistema de diseño: `XPWindow`, `XPButton` (variantes agree / disagree / neutral), `XPDialog`, contador, texto de consentimiento con scroll.
- `src/levels/level01/ … level12/` — un directorio por nivel, autocontenido: componente + lógica pura (`logic.ts`) + estilos. Se cargan con `React.lazy`.
- `src/levels/types.ts` — contrato `LevelComponent` (props comunes: `onWin`, `onLose`, control del contador).
- `src/levels/hostChannel.ts` — canal único nivel→host con ranuras con nombre (`footer`, `windowTransform`, `windowRef`, `board`); `useLevelFooter`/`useLevelBoard` son envoltorios finos sobre las ranuras `footer`/`board`. `board` (nivel 3, `useLevelBoard`) publica un tablero de juego que `XPWindow` renderiza DEBAJO del marco azul (`boardBelowFrame`), fuera de él, en vez de dentro de `children` — para cuando el marco azul solo debe envolver el texto de consentimiento, no el tablero.
- `src/hooks/device.ts` — `isCoarsePointerDevice()`, detección de dispositivo táctil por tipo de puntero (no por ancho de pantalla); compartida por `AudioManager` (multiplicador de volumen de la música) y el nivel 3 (población de la lluvia).
- `src/state/` — store global (run actual, ajustes, ranking) y módulo `storage.ts` (único punto de acceso a localStorage).
- `src/i18n/` — diccionarios y hook de traducción.
- `src/audio/` — reproductor de sonidos y música.
- `src/data/nivel6-tablero.json` — layout verificado del nivel 6 (copiar desde `spec/assets/`).
- `spec/tools/validate-level6.mjs` — validador del tablero del nivel 6; ejecutar tras cualquier edición del layout.
- `src/assets/fonts/` — fuentes pixel (woff2). 
- `src/assets/audio/` — `positive.*`, `negative.*`, `music.*`. 
- `src/assets/images/` — sprites e iconos del juego; ver `src/assets/images/`. Todo importado desde el código (nunca en `public/`); pixel art siempre en PNG

## Comandos

- `npm run dev` — entorno local (Vite).
- `npm run test` — Vitest.
- `npm run lint` — ESLint + Prettier.
- `npm run build` — build de producción.
- `node spec/tools/validate-level6.mjs` — valida el tablero del nivel 6.

## Modelo de datos / dominio

- `RankingEntry { username, character (0-3), maxLevel, date, finished? }` — récord **histórico** por usuario. Nunca se borra con un Game Over. Se actualiza solo si se supera el récord propio.
- `RunState { completedLevels: LevelId[], currentLevel: LevelId, activeLevelTimeLeft: number | null }` — progreso de la partida en curso, **persistido en localStorage** igual que ajustes y ranking (`aac.v1.run`): recargar la página no hace perder la partida ni el contador del nivel activo, el juego retoma donde se dejó. Se reinicia por completo (incluido `activeLevelTimeLeft`) con cualquier Game Over.
- `Settings { language, volume (solo música), musicOn, soundEffectsOn }` — persistido en localStorage.
- `LevelId = 1..12` — la progresión es estrictamente lineal; `currentLevel` siempre es el primer nivel no completado.
- Contrato de nivel: cada nivel recibe `onWin()` / `onLose(reason)`, el tiempo restante, `paused` (el shell congela el nivel durante veredictos y modales) y `onRestart?` opcional (el nivel pide "vuelve a empezarme"; el shell remonta su componente y reinicia el contador a 100 — solo lo declaran los niveles que lo necesitan, p. ej. el nivel 1); **no** navega por sí mismo ni toca el store del run. El contador (100 s, gestionado por el shell) y el botón X son responsabilidad de la ventana común, no del nivel.
- Botones inferiores del nivel: se registran con el hook `useLevelFooter(nodo)` (`src/levels/hostChannel.ts`), que los publica en el pie de `XPWindow` — fuera del marco azul del área de juego, incluso si el nivel usa ese marco para su propio contenido (tablero o, como el nivel 1, su texto de consentimiento). El nodo pasado debe ir memoizado (`useMemo`) con dependencias primitivas estables; una referencia nueva en cada render entra en bucle con el estado del `footer` en `LevelHost`.
- Canal nivel→host (`src/levels/hostChannel.ts`, consolidado en la feature 007): un único contexto con ranuras con nombre en vez de un hook/contexto suelto por cada necesidad nueva — la regla es añadir una ranura aquí antes que crear un mecanismo paralelo. Ranuras actuales:
  - `footer` — ver punto anterior (`useLevelFooter`).
  - `windowTransform: string | null` — `useWindowRotation(deg)` la publica como `${deg}deg`; `LevelHost` la aplica como la custom property `--window-rotation` en el contenedor que envuelve y rota `XPWindow` (nivel 3: rotación libre de la ventana entera).
  - `windowRef` — `useHostWindowRef()`; ref de solo lectura al contenedor que rota, para que un nivel enganche su propio `usePointer` sobre TODA la ventana (barra de título incluida) sin manipularla directamente (nivel 3: arrastrar para rotar).
  - `board` — `useLevelBoard(nodo)`; publica el tablero de juego que `XPWindow` renderiza como `boardBelowFrame`, DEBAJO del marco azul y fuera de él, en el espacio sobrante del cuerpo de la ventana — a diferencia de `children` (dentro del marco), el marco no lo envuelve. Usa `useLayoutEffect` (no `useEffect`, a diferencia de `useLevelFooter`): el nivel 3 depende de que el tablero quede montado y su física sincronizada antes del primer pintado, para no repetir el "flash" de carga ya corregido una vez.
- `LevelDefinition.consentKey` es opcional: se omite en los niveles sin tablero propio, que muestran su texto directamente en el marco del área de juego (`XPWindow` con `scrollableContent`) en vez del recuadro de consentimiento aparte — el nivel 1 fue el primero (texto largo), el nivel 3 lo reutiliza para su texto (el nivel 3 además publica su tablero aparte vía `useLevelBoard`, ver arriba). `scrollableContent` (el interior hace scroll propio, acotado a una altura moderada — 12rem) y `fillHeight` (la ventana entera ocupa la altura de su contenedor) son props independientes de `XPWindow`. `boardBelowFrame` (opcional): cuando se pasa, el marco azul deja de estirarse (`flex: 1`) y se ajusta a `children` en vez de estirarse — es el tablero quien aprovecha el espacio sobrante (corregido tras revisión de Sofía sobre la 007, tercera ronda: al principio el nivel 3 metía texto + tablero dentro del mismo marco con `fillHeight`, estirando el marco azul sobre ambos — el diseño real quiere el marco azul ajustado solo al texto). `LevelDefinition.fillHeight` (opcional, booleano) es lo que un nivel usa para pedir `fillHeight` en `XPWindow`: la pantalla de selección lo usa directamente; el nivel 1 no lo necesita (solo texto, cabe en el límite moderado); el nivel 3 sí — no por el texto (que ahora vuelve a acotarse a los 12rem de siempre), sino porque sin altura real en la ventana no habría espacio "sobrante" que darle al tablero (`boardBelowFrame`) debajo del marco.
- Invariante del nivel 6: el tablero de `nivel6-tablero.json` solo se modifica pasando el validador.

## Convenciones

- Componentes en `PascalCase`, funciones/variables en `camelCase`, un componente por archivo.
- Tests junto al código: `logic.ts` + `logic.test.ts`. Prioridad de testing: lógica pura de niveles y del meta-flujo (progresión, reinicio, ranking).
- **Ningún texto visible hardcodeado**: todo pasa por i18n, incluidos los textos de los botones. Los términos de juego (game.agree, game.disagree y demás textos de botón en inglés) viven igualmente en los diccionarios, con el mismo valor en ES y EN; un test lo verifica para que nadie los "traduzca" por error (GDD §11).
- **Ningún color hardcodeado**: solo variables CSS de `tokens.css`.
- Timers: un único hook `useCountdown` compartido; prohibido sembrar `setInterval` sueltos por los niveles (fuente clásica de fugas al desmontar). **Excepción (feature 007):** los bucles de física/animación (`requestAnimationFrame`, `Runner` de matter.js) sí están permitidos dentro de un nivel, con limpieza obligatoria en el cleanup del efecto (Runner parado, rAF cancelado, listeners desconectados) — `setInterval` sigue prohibido sin excepción.
- Todo efecto (física, animaciones, audio, listeners) se limpia en el cleanup del efecto: al desmontar un nivel no debe quedar nada vivo.
- Idioma del código (identificadores, nombres de archivo): inglés. Idioma de los comentarios: **español**. Idioma de la spec: español. Idioma de los mensajes de commit: inglés, siempre.
- **Componentes reutilizables primero**: nada de duplicar ventanas, botones, diálogos o contadores dentro de un nivel. Si un nivel necesita una variante, se extiende el componente del sistema de diseño (`src/components/xp/`) con props, no se copia. Regla práctica: si un patrón visual aparece en 2+ sitios, se extrae a `xp/`. `XPButton` reenvía su `ref` (`forwardRef`) al `<button>` real — lo necesita cualquier nivel que deba sincronizar su posición desde fuera del ciclo de render de React (nivel 3: los Disagree de la lluvia, posicionados por matter.js vía `transform` en cada paso de física).
- Los niveles consumen la entrada a través de un hook común (`usePointer`) que normaliza ratón y táctil; prohibido escuchar eventos de ratón directamente en los niveles.
- **CSS Modules en Sass, con BEM**: cada componente tiene su `NombreComponente.module.scss`. Una clase raíz por bloque (`.block`), elementos como `.block__element`, variantes como `.block--modifier` (o `.block__element--modifier`). Nombres de bloque/elemento/modificador siempre en inglés, descriptivos y en kebab-case (`corner-menu`, no `cm` ni `cornerMenu`) — como casi todos los bloques son de varias palabras, en el `.tsx` se accede **siempre con notación de corchete** (`styles['corner-menu__icon-button--active']`), nunca de punto, para no mezclar los dos estilos según si el nombre tiene guion o no. Aprovechar el anidado de Sass (`&__x`, `&--y`) para no repetir el nombre del bloque.
- **Evitar estilos en línea (`style={{...}}`) salvo que sean genuinamente necesarios**: un valor solo justifica ir en línea si se calcula en tiempo de ejecución y no puede expresarse como una clase (p. ej. un `scale()` de un `ResizeObserver`, o la URL de una imagen importada desde JS que un `.scss` no puede referenciar). En esos casos, el patrón preferido es fijar únicamente una custom property CSS por estilo en línea (`style={{ '--my-var': valor }}`) y consumirla desde la clase Sass (`.block { transform: scale(var(--my-var)); }`), no escribir la propiedad final entera en línea. Cualquier valor conocido en build-time (colores, anchos fijos, breakpoints) va en la clase, nunca en línea.

## Estilo visual

- Tokens de color (de `tokens.css`, valores del GDD): título `#2451E0→#026DE9`, beige `#EFE7DC`, azul marco `#153859`, agree `#CDF5CE`/`#7CBF89`, disagree `#FDD2D3`/`#C7858A`, neutro `blanco→#DFE0D8` con bordes `#3E587F`/`#96A6D9`, cerrar `#E84443`, borde botón `#345779`, guía beige `#B49E85`.
- Fuentes: **DotGothic16** (UI) y **Press Start 2P** (display), ambas OFL-1.1.
- `image-rendering: pixelated` en todos los sprites; escalado en múltiplos enteros siempre que sea posible.

### Responsive

- **CSS mobile-first** con estos breakpoints (variables/tokens únicos, prohibido inventar otros ad hoc):
  - `xs` — ≤ 375 px (móvil pequeño, referencia iPhone SE 375×667)
  - `sm` — 376–480 px (móvil normal)
  - `md` — 481–1024 px (tablet)
  - `lg` — 1025–1440 px (desktop)
  - `xl` — > 1440 px (large desktop)
- **Resolución lógica + escala** para las áreas de juego: cada nivel se diseña sobre un lienzo lógico fijo (p. ej. 640×360) y el shell lo escala con `transform: scale()` para encajar en el viewport. Así la física, el plinko o el tablero del nivel 6 no necesitan lógica por breakpoint: solo cambia la escala. La UI que rodea al área (texto, botones, barra de título) sí fluye con CSS normal.
- La ventana XP ocupa prácticamente todo el viewport en `xs`/`sm` y un tamaño fijo centrado en `lg`/`xl`.
- Objetivo de tamaño táctil: zonas interactivas ≥ 44×44 px reales en móvil.
- QA obligatorio por feature en: 375 px, 480 px, 768 px, 1280 px y 1920 px.

### Entrada táctil

- Usar **Pointer Events** (`pointerdown/move/up`), nunca `mousedown`/`touchstart` por separado: un solo código para ratón y dedo.
- Los estados `hover` son decorativos: ninguna mecánica puede depender de hover.
- Toda mecánica de ratón tiene su equivalente táctil **definido en el GDD** (sección "Responsive y controles táctiles"). Si una feature de nivel no lo tiene definido, se define antes de tocar código.

## Límites duros

- **No añadir dependencias** sin actualizar este documento primero.
- **No acceder a localStorage** fuera de `src/state/storage.ts`.
- **Nunca montar más de un nivel a la vez**, ni renderizar pantallas inactivas: el shell monta exclusivamente la pantalla/nivel activo (`React.lazy` + desmontaje completo al salir).
- **No romper el contrato `LevelComponent`** ni dejar que un nivel manipule la navegación o el progreso directamente.
- **No modificar `nivel6-tablero.json`** sin volver a pasar el validador.
- **No contradecir el GDD** sin actualizarlo explícitamente en el mismo cambio.
