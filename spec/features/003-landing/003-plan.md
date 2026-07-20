# 003 · Landing — Plan

## Enfoque

Primero las piezas nuevas del sistema de diseño (`CuteButton`, `XPTextInput`, `XPSlider`, `XPToggle`), cada una con su sección de Playground, y después la pantalla: fondo + botón Empezar + esquina de accesos, con las cuatro ventanas modales (Personaje / Ranking / Información / Configuración) construidas sobre la `XPWindow` existente. Los datos de personajes viven en un módulo propio y la lógica de nombres en funciones puras con test.

## Implementación

1. **`CuteButton`** — `src/components/cute/CuteButton/`: botón pixel *cute* con hueco para icono; el corazón pixel en `src/assets/images/ui/heart.png`. Estados normal/hover/pulsado/deshabilitado coherentes con el resto. + Playground. ✋ El estilo exacto lo aprueba Sofía.
2. **`XPTextInput`** — `src/components/xp/XPTextInput/`: borde hundido clásico, `font-size` ≥ 16 px en móvil (evita el zoom de iOS). + Playground.
3. **`XPSlider`** — `src/components/xp/XPSlider/`: sobre `<input type="range">` nativo re-estilizado (accesibilidad y táctil gratis), zona ≥ 44 px. + Playground.
4. **`XPToggle`** — `src/components/xp/XPToggle/`: casilla estilo XP. + Playground.
5. **Datos de personajes** — `src/app/characters.ts`: `[{ id, sprite, defaultName }]` con Crumbs / Incognito / Granny Agree / Monster Byte. Los nombres son datos, no claves i18n.
6. **`LandingScreen`** — fondo (`background-size: cover` + `image-rendering: pixelated`), `CuteButton` Empezar centrado-abajo, `CornerMenu` inferior-derecha con los cuatro accesos. Estado interno: qué modal está abierto (`none | character | ranking | info | settings`).
7. **Modal Personaje** — cuadrícula de miniaturas + `XPTextInput`; lógica pura en `playerForm.ts` (trim, máx. 16, vacío→nombre por defecto) con tests; confirmar guarda en `aac.v1.lastPlayer` vía `storage.ts`.
8. **Modal Ranking** — `RankingList`; orden en `rankingSort.ts` (puro, test): nivel desc, fecha asc; estado vacío.
9. **Modal Información** — contenido desde i18n (`landing.info.*`) con scroll interno; redactado como borrador para el checkpoint.
10. **Modal Configuración** — idioma + `XPSlider` (sonido de referencia al soltar, no en cada cambio) + `XPToggle`, conectados a `settingsStore`.
11. **Empezar** — resuelve el jugador actual (último persistido o Crumbs por defecto), inicializa `run` y navega a la selección de niveles.
12. **Integración y QA** — recorrido completo, 5 anchos, móvil real vía Pages, repaso de criterios.

## Decisiones

- **Modales XP sobre el fondo** en lugar de navegar a sub-pantallas — mantiene la landing siempre visible detrás (luce el fondo de Sofía), es coherente con la estética, y su X que aquí sí cierra sin castigo refuerza el chiste de que solo los niveles te castigan por cerrar. Descartado: vistas que sustituyen la pantalla completa.
- **Nombres por defecto en inglés, como datos, no i18n** — son nombres propios, no se traducen; viven en `characters.ts`, idénticos en ambos idiomas. Descartado: meterlos en los diccionarios (invitaría a "traducirlos").
- **Vacío → restaurar nombre por defecto** en lugar de bloquear con error — siempre hay un nombre válido y el flujo nunca se atasca; la validación dura (trim, longitud) sigue existiendo. Descartado: botón deshabilitado con campo vacío.
- **Empezar no obliga a elegir personaje** — decisión de Sofía; el par (Crumbs, personaje 1) es el jugador de la primera visita. El último jugador persiste en `aac.v1.lastPlayer`.
- **`CuteButton` en `src/components/cute/`, separado de `xp/`** — son lenguajes visuales distintos (cute vs sistema operativo) y la separación física evita mezclar estilos; las reglas comunes (tokens, estados, tamaños táctiles) se mantienen. Descartado: variante de `XPButton` (lo llenaría de condicionales).
- **La Información es una modal más de la esquina** — decisión de Sofía; mismo patrón que el resto, contenido 100% i18n.

## Riesgos

- **El fondo con `cover` recorta zonas según la proporción de pantalla** — mitigación: QA en los 5 anchos con el asset real; el botón Empezar y la esquina se posicionan sobre zonas seguras; si el recorte molesta, decidir con Sofía (`contain` + relleno o asset vertical alternativo).
- **El botón Empezar y la esquina compiten con el fondo en legibilidad** — mitigación: comprobar contraste sobre el asset real; si hace falta, sombra/placa pixel bajo los botones (con el visto bueno de Sofía).
- **Zoom de iOS al enfocar el input** — mitigación: `font-size` ≥ 16 px y prueba en móvil real.
- **Sprites de tamaños distintos entre sí** — mitigación: miniaturas en contenedor fijo con escalado entero; si un sprite baila, se corrige el asset, no el CSS.
- **La guía de Información revela trucos sin querer** — mitigación: el checkpoint de Sofía es criterio de aceptación; la regla es describir *qué hace* el juego, nunca *cómo se gana* un nivel.
- **Cuatro botones en la esquina se amontonan en 375 px** — mitigación: en `xs` pueden pasar a iconos con etiqueta accesible o apilarse en columna; comprobar en QA que no tapan zonas importantes del fondo.
