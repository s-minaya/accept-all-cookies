# 003 · Landing — Tareas

- [ ] Implementar `CuteButton` (con hueco para icono + corazón pixel) y añadirlo a la Playground.
- [ ] ✋ **Checkpoint con Sofía**: aprobar el estilo del `CuteButton` viéndolo en la Playground sobre el fondo real.
- [ ] Implementar `XPTextInput` (font-size ≥ 16 px en móvil) y añadirlo a la Playground.
- [ ] Implementar `XPSlider` (range nativo re-estilizado, zona ≥ 44 px) y añadirlo a la Playground.
- [ ] Implementar `XPToggle` y añadirlo a la Playground.
- [ ] Crear `characters.ts` con los 4 personajes y sus nombres por defecto (Crumbs, Incognito, Granny Agree, Monster Byte).
- [ ] Montar `LandingScreen`: fondo a pantalla completa, Empezar centrado-abajo, `CornerMenu` inferior-derecha con los cuatro accesos, estado de modal abierto.
- [ ] Modal Personaje: cuadrícula de miniaturas + campo de nombre editable; lógica pura de nombres con tests (trim, máx. 16, vacío→por defecto); persistencia en `aac.v1.lastPlayer`.
- [ ] Modal Ranking: `RankingList` + orden puro con test + estado vacío.
- [ ] Modal Información: redactar la guía ES/EN (borrador) bajo `landing.info.*`, sin spoilers, con scroll interno.
- [ ] ✋ **Checkpoint con Sofía**: aprobar los textos de la guía en ambos idiomas.
- [ ] Modal Configuración: idioma, volumen con sonido de referencia al soltar, interruptor de música.
- [ ] Conectar Empezar: jugador actual (último o Crumbs), inicializar partida, navegar a la selección de niveles.
- [ ] Añadir todas las claves `landing.*` a ambos diccionarios (ES y EN); los nombres por defecto NO van en los diccionarios.
- [ ] QA responsive en los 5 anchos (recorte del fondo, legibilidad y amontonamiento de la esquina en 375 px) y QA táctil en móvil real vía Pages (incluido el no-zoom del input en iOS).
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.

## Mantenimiento (checklist recurrente)

- [ ] Si se añade o cambia un sprite de personaje, comprobar la miniatura, el resaltado de selección y el avatar del ranking con el asset nuevo.
