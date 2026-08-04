# 017 · Pulido y QA transversal

**Estado:** aprobada

## Qué hace

Última feature del proyecto. No añade mecánicas: cierra el juego. Ocho bloques independientes que pueden abordarse por separado (y partirse en dos features si se hace largo).

### A. Retirada de la Playground · `?dev` se queda

- **La Playground desaparece del build de producción** pero **sigue en el repo** y sigue funcionando en `npm run dev` (`?playground`): es la herramienta para trabajar el sistema de diseño, no código muerto.
- **`?dev` se queda en producción como secreto**: el botón de saltar nivel sigue disponible para quien conozca el parámetro. Deja de tener fecha de caducidad; se documenta como característica, no como deuda.
- **Nivel de prueba** (`src/levels/_test/`): se queda en el repo como arnés del contrato `LevelComponent`, accesible solo desde la Playground (por tanto, solo en desarrollo). Deja de estar en el bundle de producción.

### B. Higiene del build

- **Los archivos de test nunca llegan a producción.** Hoy se cumple por accidente afortunado (Vite solo empaqueta lo alcanzable desde el punto de entrada); pasa a ser **regla escrita en `tech-stack.md` + verificación automatizada** en el build.
- **Sin sourcemaps en producción**: verificar la configuración y que `dist/` no contiene `.map` ni referencias a ellos. Es lo que separa "código minificado ilegible" de "el proyecto entero legible en DevTools".
- Revisión de chunks: tamaño del bundle principal, que matter.js siga compartido entre los niveles 3 y 4 y no en el principal, y que cada nivel siga en su chunk.

### C. Antiespoilers y mensaje de consola

- **Auditoría de fugas en el DOM**: ningún estado que el jugador no debería ver puede leerse desde el inspector *mientras juega*. El nivel 8 ya tiene su test de indistinguibilidad; se audita del mismo modo el **9** (qué casilla está congelada / qué botón hay), el **10** (qué ventana lleva el Agree antes del sorteo) y el **12** (`switchAt`).
- **No se persigue la ofuscación real**: el código llega al navegador y eso es aceptable. El objetivo es que curiosear por encima no arruine el juego, no impedirlo.
- **Mensaje de consola** al arrancar (`console.log` con estilos): un guiño para quien abre DevTools, en el tono del juego.
- Ese mensaje **revela `?dev`** (una puerta secreta que solo encuentra quien mira donde mira un programador) 

### D. Balanceo de dificultad

- **Partida completa sin `?dev`**, de la landing a los créditos, tomando notas por nivel: ¿el contador de 100 s da o aprieta? ¿algún nivel frustra en vez de divertir?
- Ajuste de los parámetros del GDD §14 que lo necesiten; cualquier cambio se refleja en el GDD y en los tests afectados en el mismo cambio.
- Objetivo declarado: que un jugador nuevo pueda terminar el juego en varias sesiones, con muertes que se sientan justas ("ya sé qué hice mal") y nunca arbitrarias.

### E. Repaso de audio

- Volúmenes relativos coherentes en todo el juego (música, positivo/negativo, `coin`, voz de Sans y su ducking).
- Verificar que ningún nivel deja audio sonando o la música agachada al salir por cualquier vía (victoria, derrota, X, recarga).
- Comportamiento correcto de los interruptores de música y efectos en las 12 pantallas de nivel.

### F. Responsive y accesibilidad

- QA de **todas** las pantallas en los 5 anchos de referencia (375 / 480 / 768 / 1280 / 1920), con **toques CDP** en los móviles.
- Accesibilidad realista, sin prometer lo imposible (varios niveles son inherentemente de puntero):
  - Foco visible y navegación por teclado en landing, selección, modales y créditos.
  - `aria-label` en todos los botones de solo icono (ya hecho en su mayoría: verificar).
  - **`prefers-reduced-motion` respetado** en los efectos decorativos: veredicto gigante, confeti, escritura del nivel 11. Nunca en la mecánica de un nivel (reducir movimiento no puede cambiar las reglas).
- **Límite de contraste de la fuente pixel** revisado en textos largos.

### G. Robustez

- **Error boundary** alrededor del nivel activo: si un chunk falla al cargar (un hipo de red en Pages), el jugador ve un mensaje XP y un botón de volver, no una pantalla en blanco.
- Arranque limpio con `localStorage` vacío, corrupto y con datos de una versión anterior (ya cubierto en la 002: reverificar tras 15 features).

### H. Cierre del proyecto

- **README del repositorio** (no existe todavía y es lo primero que ve un recruiter), **en español**, cuidado y con la voz *cute* del proyecto (corazón pixel y kaomoji como adorno de secciones, con mesura). Secciones, en este orden: título + gancho de una línea · GIF de demo · **por qué lo construí** · stack · funcionalidades concretas · instalación y ejecución · estructura de carpetas · decisiones técnicas interesantes · cómo se construyó (SDD + Claude Code, con honestidad y proporción, enlazando `spec/`) · roadmap (más niveles y orden aleatorio entre partidas) · créditos e inspiración (Doki Doki Action Game y Sans © Toby Fox) · contacto (LinkedIn, portfolio, correo).
- **Metadatos para compartir**: `<title>`, descripción y etiquetas Open Graph con imagen, para que el enlace se vea bien en LinkedIn o X.
- **Sincronización documental final**: GDD, constitución y specs coinciden con lo construido; todas las features en "Hecho"; ninguna casilla de checkpoint abierta.

## Por qué

El juego está terminado, pero un proyecto de portfolio no acaba en "funciona": acaba en "se puede enseñar". Esta feature convierte doce niveles jugables en algo que alguien puede abrir, entender, jugar y valorar en cinco minutos — y deja el repo en un estado presentable para hablar de él en una entrevista.

## Criterios de aceptación

- [ ] El build de producción no contiene la Playground, el nivel de prueba, archivos de test ni sourcemaps (verificado sobre `dist/`, no supuesto).
- [ ] `npm run dev` sigue sirviendo la Playground en `?playground`, con todos los componentes del sistema de diseño.
- [ ] `?dev` sigue funcionando en producción y está documentado como característica en AGENTS.md y en el roadmap (ya no como deuda a retirar).
- [ ] Regla escrita en `tech-stack.md`: los archivos de test viven en el repo y nunca en el bundle; verificación automatizada que fallaría si alguien los importara desde código de producción.
- [ ] Auditoría antiespoiler de los niveles 9, 10 y 12 con tests equivalentes al de indistinguibilidad del 8.
- [ ] Mensaje de consola presente en producción, en el tono del juego.
- [ ] Partida completa sin `?dev` jugada de principio a fin; los ajustes de dificultad acordados están aplicados y reflejados en el GDD §14 y en los tests.
- [ ] Ningún nivel deja audio sonando ni la música agachada al salir por ninguna vía; interruptores de música y efectos correctos en los 12 niveles.
- [ ] Todas las pantallas correctas en los 5 anchos, con toques CDP en móvil; foco visible y teclado funcional en landing, selección, modales y créditos; `aria-label` en todos los iconos.
- [ ] `prefers-reduced-motion` reduce veredicto, confeti y escritura sin alterar ninguna regla de juego.
- [ ] Un fallo al cargar un chunk de nivel muestra un mensaje XP con salida, no una pantalla en blanco (probado forzando el fallo).
- [ ] README publicado en español con las doce secciones acordadas (gancho, GIF, porqué, stack, funcionalidades concretas, instalación, estructura, decisiones técnicas, SDD + Claude Code, roadmap, créditos, contacto), enlace jugable a Pages y adornos *cute* coherentes; metadatos y Open Graph correctos (verificado con un validador de enlaces).
- [ ] GDD, constitución y specs sincronizados; todas las features en "Hecho"; ninguna casilla de checkpoint abierta en ninguna feature.

## Fuera de alcance

- Mecánicas nuevas o cambios de diseño de nivel → si aparece una idea, va al backlog, no aquí.
- Ofuscación real del código cliente → imposible y contraria al principio "el engaño es del juego, no del código".
- Accesibilidad completa por teclado en los niveles de puntero → varios son inherentemente táctiles/ratón; se documenta la limitación en vez de fingirla.
- Traducción a más idiomas, backend, ranking online → fuera del proyecto (`mission.md`).
