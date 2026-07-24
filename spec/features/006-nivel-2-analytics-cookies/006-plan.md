# 006 · Nivel 2 — Analytics Cookies — Plan

## Enfoque

Copia literal de la receta de la 005 con la mínima diferencia posible: carpeta `src/levels/level02/`, texto en el marco azul, botones en el pie vía `useLevelFooter` (nodo memoizado), y el intercambio de colores resuelto con las props existentes de `XPButton` (`variant` para el color, texto de `game.*`). Cero componentes nuevos, cero estilos nuevos.

## Implementación

1. **Componente** — `src/levels/level02/Level02.tsx`: texto de consentimiento (`levels.2.*`) en el marco; pie con `XPButton variant="disagree"` + texto `game.agree` (→ `onWin()`) y `XPButton variant="agree"` + texto `game.disagree` (→ `onLose(<motivo botón incorrecto>)`).
2. **Motivo de derrota** — reutilizar el `LoseReason` existente para "botón incorrecto" si ya lo hay; si no existe, añadirlo al tipo (cambio aditivo, documentado en `tech-stack.md` en el mismo cambio). No cambia nada del flujo: el shell trata todos los motivos igual.
3. **Estilos** — `Level02.module.scss` mínimo (disposición del pie si hiciera falta algo que no cubra ya el patrón del nivel 1); idealmente casi vacío.
4. **Registro** — sustituir el hueco 2 por `React.lazy(() => import('./level02/Level02'))`.
5. **i18n** — `levels.2.*` (nombre ya existe de la 004; añadir el texto de consentimiento) en ES y EN.
6. **Tests** — de componente, no de lógica: pulsar el botón con texto Agree llama a `onWin`; pulsar el de texto Disagree llama a `onLose` con su motivo; los estilos de variante aplicados están cruzados respecto al texto (aserción sobre la clase de variante).
7. **QA** — partida completa ganando y perdiendo; recarga a mitad de nivel y con desenlace pendiente; 5 anchos; móvil real vía Pages.

## Decisiones

- **Sin `logic.ts`** — este nivel no tiene máquina de estados ni cálculo alguno: crear un archivo de lógica pura vacío por ritual sería culto al molde, no ingeniería. La receta de la 005 dice "lógica pura *con test* cuando hay lógica"; aquí el test es de componente. (Precedente explícito para futuros niveles triviales.)
- **El intercambio es solo de `variant` + texto** — nada de estilos "espejados" nuevos: si `XPButton` no pudiera expresar esto con sus props actuales, la corrección iría al sistema de diseño, no a este nivel. Descartado: clases propias del nivel imitando los colores cruzados (duplicaría el estilo del botón, prohibido por la constitución).
- **Motivo de derrota tipado para "botón incorrecto"** — aunque el shell no distinga motivos hoy, el tipo documenta por qué se perdió y varios niveles futuros (3, 7, 8, 9, 10, 11, 12) pierden por esta misma vía; mejor un motivo compartido desde ya que doce strings ad hoc.

## Riesgos

- **Que "casi cero código" invite a saltarse el proceso** — mitigación: la feature pasa por el mismo ciclo completo (spec → plan → tasks → QA con partida entera) precisamente para medir cuánto cuesta el ciclo con la mecánica más barata; si el overhead se siente desproporcionado aquí, es dato para ajustar el proceso, no para saltárselo.
- **Confusión de lectura en el código** (`variant="disagree"` en el botón que gana) — mitigación: comentario en español de una línea junto a cada botón explicando el cruce intencionado, y el test de la clase de variante lo fija contra regresiones de un "arreglo" bienintencionado.
- **El jugador de móvil pulsa por posición, no por color ni texto** (el Agree del nivel 1 estaba a la izquierda) — no es riesgo técnico sino de diseño: el GDD no fija el orden de los botones de este nivel. Se implementa con Agree a la izquierda (mismo orden que el nivel 1) para que el engaño sea solo el color, no también la posición. Si Sofía prefiere barajar posición, es un cambio de una línea + GDD.
