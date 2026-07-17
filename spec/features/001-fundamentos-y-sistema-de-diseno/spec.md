# 001 · Fundamentos y sistema de diseño

**Estado:** propuesta

## Qué hace

Crea el proyecto y todas las piezas visuales y de infraestructura que los 12 niveles y las pantallas del juego van a reutilizar:

- El **proyecto base** (Vite + React 18 + TypeScript estricto) con lint, tests y build funcionando, y despliegue automático a GitHub Pages.
- Los **tokens de diseño**: todos los colores del GDD como variables CSS, las dos fuentes pixel (UI estilo Tahoma + display para botones y textazos) y los 5 breakpoints responsive.
- Los **componentes XP** del sistema de diseño:
  - `XPButton` — variantes *agree* / *disagree* / *neutral*, con sus 4 estados (normal, hover, pulsado, deshabilitado) tal como los define el GDD (§3).
  - `XPWindow` — barra de título con degradado, contador a la izquierda, título centrado, botón X, recuadro de texto de consentimiento con scroll interno y marco azul del área de juego (GDD §4).
  - `XPDialog` — ventana modal centrada sin botón de cerrar (base de Game Over, Level Complete y los diálogos del nivel 1).
- Los **hooks de infraestructura**:
  - `useCountdown` — cuenta atrás de 100 s pausable con callback al llegar a 0 (el único mecanismo de timer permitido en el proyecto).
  - `usePointer` — entrada unificada ratón/táctil con Pointer Events: posición, tap vs drag (umbral 8 px) y detección de "puntero inmóvil" (para el nivel 9).
- El sistema de **resolución lógica + escala**: componente `GameArea` que renderiza un lienzo lógico fijo y lo escala al viewport.
- Una pantalla **Playground** que muestra todos los componentes en todas sus variantes y estados, para verificar la feature y servir de referencia visual durante el resto del proyecto. **Se incluye en el build y se despliega en Pages** (mientras no exista el juego, es lo que se publica: permite probar táctil y responsive en dispositivos reales); se ocultará del build en la feature 017.

Los componentes reciben todos sus textos por props: en esta feature no hay i18n todavía (llega en la 002), pero ningún componente hardcodea texto.

## Por qué

Todo lo demás depende de esto. Los 12 niveles comparten la misma ventana, los mismos botones y la misma entrada; si esto no nace bien (y responsive desde el primer día), cada nivel lo pagaría por separado. Hacer el Playground primero permite validar la estética XP/pixel con Sofía antes de construir ningún nivel encima.

## Criterios de aceptación

- [x] En un clon limpio: `npm install` + `npm run dev`, `npm run test`, `npm run lint` y `npm run build` funcionan sin errores.
- [ ] Cada push a `main` publica automáticamente en GitHub Pages y la URL pública carga sin 404 de assets. _Workflow creado (`.github/workflows/deploy.yml`); pendiente verificar tras el primer push con Pages habilitado en el repo._
- [x] Existe `tokens.css` con todos los colores del GDD; ningún otro archivo del proyecto define colores en crudo.
- [x] Las dos fuentes pixel cargan autoalojadas (woff2), con licencia libre verificada, y los sprites/texto se ven nítidos (`image-rendering: pixelated`).
- [x] `XPButton` muestra las 3 variantes con los colores, bordes concéntricos y relieve del GDD; el estado pulsado hunde el botón 1–2 px y reduce la sombra; el estado deshabilitado se ve más oscuro y no responde.
- [ ] En dispositivo táctil, los botones no se quedan con el estado hover "pegado" tras tocarlos. _El hover está detrás de `@media (hover: hover)`; falta confirmar en un móvil real._
- [x] `XPWindow` renderiza barra de título con degradado `#2451E0→#026DE9`, contador, título centrado, botón X rojo con borde blanco, recuadro de texto con scroll vertical interno y altura fija, y el marco azul del área de juego unido a la barra de título.
- [x] `XPDialog` se muestra centrado sobre el contenido, sin botón X, con el fondo visible detrás.
- [x] `useCountdown` cuenta de 100 a 0, se puede pausar/reanudar/reiniciar, dispara el callback exactamente una vez al llegar a 0, y no deja timers vivos al desmontar. Cubierto por tests.
- [x] `usePointer` distingue tap de drag con el umbral de 8 px y detecta puntero inmóvil durante un tiempo configurable, con el mismo comportamiento usando ratón y usando dedo. Lógica pura cubierta por tests.
- [x] `GameArea` escala un lienzo lógico de 640×360 para encajar en el viewport manteniendo la proporción, sin desbordarse en ninguno de los 5 anchos de referencia.
- [ ] El Playground muestra todo lo anterior, es la página publicada en Pages y es usable desde un móvil real (táctil incluido). _Muestra todo lo anterior; falta el despliegue real y la prueba en móvil._
- [x] QA visual del Playground correcto en 375, 480, 768, 1280 y 1920 px de ancho (verificado con Chromium headless); en móvil todas las zonas interactivas miden ≥ 44×44 px reales.

## Fuera de alcance

- i18n, store de Zustand, audio, localStorage y enrutado de pantallas → **feature 002**.
- Landing, ranking y ajustes → **feature 003**.
- Animaciones AGREE/DISAGREE gigantes y ventanas de Game Over / Level Complete → **feature 004** (usarán `XPDialog` y la fuente display de aquí).
- Cualquier mecánica de nivel.
- Sprites definitivos de personajes (los diseña Sofía; aquí solo tipografía y componentes).
