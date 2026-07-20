# 003 · Landing — Plan

## Enfoque

Primero las piezas nuevas del sistema de diseño (`CuteButton`, `XPTextInput`, `XPSlider`, `XPToggle`), cada una con su sección de Playground, y después la pantalla: fondo + botón Empezar + esquina de accesos, con las cuatro ventanas modales (Personaje / Ranking / Información / Configuración) construidas sobre la `XPWindow` existente. Los datos de personajes viven en un módulo propio y la lógica de nombres en funciones puras con test.

## Implementación

1. **`CuteButton`** — `src/components/cute/CuteButton/`: botón pixel *cute* con hueco para icono; el corazón pixel en `src/assets/images/ui/heart.png`. Estados normal/hover/pulsado/deshabilitado coherentes con el resto. + Playground. ✋ El estilo exacto lo aprueba Sofía. — Aprobado el 2026-07-20 (tamaño del corazón ajustado por Sofía).
2. **`XPTextInput`** — `src/components/xp/XPTextInput/`: borde hundido clásico, `font-size` ≥ 16 px en móvil (evita el zoom de iOS). + Playground.
3. **`XPSlider`** — `src/components/xp/XPSlider/`: sobre `<input type="range">` nativo re-estilizado (accesibilidad y táctil gratis), zona ≥ 44 px. + Playground.
4. **`XPToggle`** — `src/components/xp/XPToggle/`: casilla estilo XP. + Playground.
5. **Datos de personajes** — `src/app/characters.ts`: `[{ id, sprite, defaultName }]` con Crumbs / Incognito / Granny Agree / Monster Byte. Los nombres son datos, no claves i18n.
6. **`LandingScreen`** — fondo (`background-size: cover` + `image-rendering: pixelated`), con dos variantes: `landing-bg.png` en escritorio (≥1025px) y `landing-bg-mobile.png` (recorte más vertical) en móvil y tablet, elegidas por `@media` sobre dos custom properties (`--bg-desktop`/`--bg-mobile`) fijadas por estilo en línea, ya que el import del asset es JS. `CuteButton` Empezar centrado-abajo. `CornerMenu` con los cuatro accesos, en fila y solo icono (ver Decisiones): esquina inferior derecha en escritorio/tablet, arriba centrado en móvil (≤480px) para no solapar con Empezar. Estado interno: qué modal está abierto (`none | character | ranking | info | settings`).
7. **Modal Personaje** — cuadrícula de miniaturas (2 columnas en móvil/tablet, 4 en escritorio, con la `XPDialog` más ancha ahí — ver Decisiones) + `XPTextInput`; lógica pura en `playerForm.ts` (trim, máx. 16, vacío→nombre por defecto) con tests; confirmar guarda en `aac.v1.lastPlayer` vía `storage.ts`.
8. **Modal Ranking** — `RankingList`; orden en `rankingSort.ts` (puro, test): nivel desc, fecha asc; estado vacío.
9. **Modal Información** — contenido desde i18n (`landing.info.*`) con scroll interno; redactado como borrador para el checkpoint.
10. **Modal Configuración** — idioma + `XPSlider` (afecta solo a la música, sonido de referencia al soltar, no en cada cambio — ver Decisiones) + `XPToggle`, conectados a `settingsStore`.
11. **Empezar** — resuelve el jugador actual (último persistido o Crumbs por defecto), inicializa `run` y navega a la selección de niveles.
12. **Integración y QA** — recorrido completo, 5 anchos, móvil real vía Pages, repaso de criterios.

## Decisiones

- **Modales XP sobre el fondo** en lugar de navegar a sub-pantallas — mantiene la landing siempre visible detrás (luce el fondo de Sofía), es coherente con la estética, y su X que aquí sí cierra sin castigo refuerza el chiste de que solo los niveles te castigan por cerrar. Descartado: vistas que sustituyen la pantalla completa.
- **Nombres por defecto en inglés, como datos, no i18n** — son nombres propios, no se traducen; viven en `characters.ts`, idénticos en ambos idiomas. Descartado: meterlos en los diccionarios (invitaría a "traducirlos").
- **Vacío → restaurar nombre por defecto** en lugar de bloquear con error — siempre hay un nombre válido y el flujo nunca se atasca; la validación dura (trim, longitud) sigue existiendo. Descartado: botón deshabilitado con campo vacío.
- **Empezar no obliga a elegir personaje** — decisión de Sofía; el par (Crumbs, personaje 1) es el jugador de la primera visita. El último jugador persiste en `aac.v1.lastPlayer`.
- **`CuteButton` en `src/components/cute/`, separado de `xp/`** — son lenguajes visuales distintos (cute vs sistema operativo) y la separación física evita mezclar estilos; las reglas comunes (tokens, estados, tamaños táctiles) se mantienen. Descartado: variante de `XPButton` (lo llenaría de condicionales).
- **La Información es una modal más de la esquina** — decisión de Sofía; mismo patrón que el resto, contenido 100% i18n.
- **Fondo vertical propio para móvil y tablet** (`landing-bg-mobile.png`) en vez de forzar el mismo asset panorámico con `cover` — decisión de Sofía el 2026-07-20, tras ver que el recorte panorámico quedaba mal. Primero se cortó solo en móvil (`max-width: 480px`); Sofía pidió extenderlo a tablet porque el panorámico "se ve muy mal" ahí también, así que el corte final es `max-width: 1024px` (límite superior de `md`/tablet en `tokens.css`): el panorámico queda reservado solo para escritorio (`lg`/`xl`).
- **Esquina inferior derecha: solo iconos, en fila, siempre** (nunca texto, nunca se apilan en columna) — decisión de Sofía el 2026-07-20 con sus propios assets (`character-selection.png`, `ranking.png`, `info.png`, `settings.png`), reemplazando la alternativa "iconos solo en `xs`" que se había dejado abierta en Riesgos. El texto de cada acceso (`landing.corner.*`) se conserva como `aria-label`, no se borra.
- **Estilo "retro 8-bit" propio para los iconos de la esquina** (borde negro puro, sombra dura sin difuminar, sin bordes redondeados) — un tercer lenguaje visual además del XP y el *cute*, a criterio propio (Sofía: "diséñalo a tu gusto"). Tokens nuevos y aislados (`--color-8bit-*` en `tokens.css`) para no filtrar el negro puro a ningún otro componente.
- **El `CornerMenu` se reposiciona solo en móvil (≤480px), a arriba centrado** — en la esquina inferior derecha se solapaba con el `CuteButton` de Empezar en pantallas estrechas (Sofía, 2026-07-20). Tablet y escritorio se quedan tal cual, sin cambios; el breakpoint de reposición es distinto del breakpoint del fondo (uno es `480px`, el otro `1024px`) a propósito, cada uno resuelve un problema visual distinto.
- **Miniaturas del modal Personaje: 2 columnas en móvil/tablet, 4 en escritorio, y `XPDialog` con un `maxWidth` opcional** — Sofía las quería "bien grandes" ("me lo curé mucho diseñándolos"). Bajar a 2 columnas ya las duplica de tamaño en pantallas estrechas; en escritorio se mantienen 4 en fila pero se añadió una prop `maxWidth` a `XPDialog` (antes fijo en `24rem` para todos los modales) para que el modal de Personaje pida `32rem` — en móvil/tablet el viewport ya limita el ancho real, así que solo se nota en escritorio, y el resto de modales (Ranking/Información/Configuración) no se ven afectados al no pasar la prop. De paso, el `image-rendering: pixelated` de las miniaturas se quitó (ajuste de Sofía): son ilustraciones, no sprites pixel-art, y se ven mejor suavizadas a este tamaño.
- **El volumen de Ajustes afecta solo a la música, no a los efectos** — decisión de Sofía el 2026-07-20 (corrige la primera versión de esta feature, que aplicaba el mismo volumen a los tres sonidos). `AudioManager` ya no toca `positive.volume`/`negative.volume` en `setVolume()`; los efectos se quedan al volumen máximo por defecto de `HTMLAudioElement`. El interruptor de música (on/off) no cambia: solo detiene/reanuda la música, como ya hacía.

## Riesgos

- **Zoom de iOS al enfocar el input** — mitigación: `font-size` ≥ 16 px y prueba en móvil real.
- **Sprites de tamaños distintos entre sí** — mitigación: miniaturas en contenedor fijo con escalado entero; si un sprite baila, se corrige el asset, no el CSS.
- **La guía de Información revela trucos sin querer** — mitigación: el checkpoint de Sofía es criterio de aceptación; la regla es describir *qué hace* el juego, nunca *cómo se gana* un nivel.

> Resueltos (ver Decisiones): el recorte del fondo panorámico se solucionó con un asset vertical propio para móvil; el amontonamiento de los cuatro botones en pantallas estrechas se solucionó pasándolos a solo icono siempre, no solo en `xs`.
