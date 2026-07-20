# 003 · Landing — Tareas

- [x] Implementar `CuteButton` (con hueco para icono + corazón pixel) y añadirlo a la Playground.
- [x] ✋ **Checkpoint con Sofía**: aprobar el estilo del `CuteButton` viéndolo en la Playground sobre el fondo real. — aprobado el 2026-07-20 (tamaño del corazón ajustado por Sofía).
- [x] Implementar `XPTextInput` (font-size ≥ 16 px en móvil) y añadirlo a la Playground.
- [x] Implementar `XPSlider` (range nativo re-estilizado, zona ≥ 44 px) y añadirlo a la Playground.
- [x] Implementar `XPToggle` y añadirlo a la Playground.
- [x] Crear `characters.ts` con los 4 personajes y sus nombres por defecto (Crumbs, Incognito, Granny Agree, Monster Byte).
- [x] Montar `LandingScreen`: fondo a pantalla completa (con variante `landing-bg-mobile.png` por debajo de 480px), Empezar centrado-abajo, `CornerMenu` inferior-derecha con los cuatro accesos en fila y solo icono (estilo retro 8-bit, decisión de Sofía del 2026-07-20 — ver `003-plan.md`), estado de modal abierto.
- [x] Modal Personaje: cuadrícula de miniaturas + campo de nombre editable; lógica pura de nombres con tests (trim, máx. 16, vacío→por defecto); persistencia en `aac.v1.lastPlayer`.
- [x] Modal Ranking: `RankingModal` + orden puro (`rankingSort.ts`) con test + estado vacío + test con datos sembrados (récord real diferido a la 004, ver spec.md).
- [x] Modal Información: redactar la guía ES/EN (borrador) bajo `landing.info.*`, sin spoilers, con scroll interno.
- [x] ✋ **Checkpoint con Sofía**: aprobar los textos de la guía en ambos idiomas. — Aprobados tal cual el 2026-07-20.
- [x] Modal Configuración: idioma, volumen con sonido de referencia al soltar, interruptor de música.
- [x] Conectar Empezar: jugador actual (último o Crumbs), inicializar partida, navegar a la selección de niveles.
- [x] Añadir todas las claves `landing.*` a ambos diccionarios (ES y EN); los nombres por defecto NO van en los diccionarios.
- [x] QA responsive en los 5 anchos (recorte del fondo, legibilidad y amontonamiento de la esquina en 375 px) — verificado con Playwright (375/480/768/1280/1920px, sin errores de consola, botones ≥44px, siempre en fila). QA táctil en móvil real vía Pages (incluido el no-zoom del input en iOS): **pendiente de Sofía** tras el despliegue.
- [x] Validar contra los criterios de aceptación de `spec.md`.
- [x] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si se añade o cambia un sprite de personaje, comprobar la miniatura, el resaltado de selección y el avatar del ranking con el asset nuevo.
