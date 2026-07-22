# 003 · Landing

**Estado:** implementada

## Qué hace

Convierte la pantalla placeholder de la landing en la entrada real del juego, con el diseño definido por Sofía:

- **Fondo**: la imagen de Sofía a pantalla completa, pixel nítido — `landing-bg.png` (panorámico) solo en escritorio (≥1025px); por debajo de eso, móvil y tablet comparten `landing-bg-mobile.png` (recorte más vertical, hecho a propósito), porque el panorámico también quedaba mal en tablet.
- **Botón Empezar**: en el centro-abajo de la pantalla, en las mismas coordenadas en cualquier ancho. **No es un botón XP**: es un botón pixel art *cute*, con el texto y un **corazón pixel** al lado. Nuevo componente del sistema de diseño (`CuteButton`). Su texto se traduce con normalidad ("Empezar" / "Start") — la regla de no traducir solo aplica a los botones del falso sistema operativo (`game.*`), y este es interfaz propia del juego.
- **Esquina inferior derecha** (escritorio y tablet, en fila) / **centro derecha, en columna** (móvil, ≤480px): cuatro botones pequeños, **solo icono** (sin texto visible; el nombre de cada uno vive como `aria-label`) — **Personaje**, **Ranking**, **Información** y **Configuración**, con los iconos de Sofía (`character-selection.png`, `ranking.png`, `info.png`, `settings.png`), construidos sobre el componente reutilizable `IconButton` (también usado por el botón "Volver atrás" de la selección). Estilo propio "retro 8-bit": borde negro, sin esquinas redondeadas, sombra dura sin difuminar — un tercer lenguaje visual además del XP y el *cute*. Cada uno abre una ventana XP modal sobre el fondo, con su X para cerrar (aquí la X solo cierra la ventana: no estamos en un nivel).

### Flujo principal

Pulsar **Empezar** inicia la partida con el jugador actualmente seleccionado y lleva directamente a la lista de niveles. **No es obligatorio pasar por la selección de personaje**: en la primera visita el jugador por defecto es el personaje 1 con su nombre por defecto; en visitas posteriores, el último personaje y nombre usados (persistidos).

### Ventana Personaje

- Cuadrícula con las **miniaturas de los 4 personajes** (sprites reales); el seleccionado queda claramente resaltado. Grandes a propósito ("quiero que luzcan", Sofía): 2 por fila en móvil y tablet, 4 por fila en escritorio (donde la ventana es más ancha, así que el tamaño se mantiene grande igualmente).
- Al seleccionar uno, debajo aparece su **nombre en un campo editable**, precargado con el nombre por defecto del personaje (o con el último nombre que ese jugador usó). El usuario puede dejarlo o escribir el suyo.
- Nombres por defecto (en inglés, definidos como datos del juego; **no se traducen**):
  1. **Crumbs** — zorrito con una cookie en la mano.
  2. **Incognito** — fantasma con forma de nube rodeado de cookies.
  3. **Granny Agree** — abuelita que acepta todas las cookies sin saber bien qué hacen.
  4. **Monster Byte**.
- Reglas del nombre: se recorta antes de guardar, máximo 16 caracteres; si queda vacío al confirmar, se restaura el nombre por defecto del personaje (no se bloquea con un error).
- Confirmar guarda personaje + nombre como jugador actual (persistido en `aac.v1.lastPlayer`).

### Ventana Ranking

- Lista de récords: avatar del personaje + nombre + nivel máximo + fecha.
- Orden: nivel máximo descendente; a igualdad, fecha más antigua primero (GDD §1.2).
- Estado vacío con su propio mensaje si no hay récords.
- Jugar con un nombre ya existente continúa su récord histórico (diseño del GDD §1.2), no es un error.

### Ventana Información

- La guía del juego (GDD §1.3), en ES/EN, en tono de reto: el objetivo (aceptar todas las categorías de cookies en los 12 niveles, "the interface disagrees"), las reglas (contador de 100 s que nunca se detiene, perder una vez reinicia al Nivel 1, la mejor puntuación se guarda por nombre de usuario) y un cierre ("Good luck... you'll need it.").
- **Sin spoilers**: describe *qué hace* el juego, nunca *cómo se gana* un nivel ni sus mecánicas ocultas.
- Scroll vertical interno si el texto no cabe.

### Ventana Configuración

- Idioma ES/EN: el cambio se aplica al instante en todo lo visible.
- Volumen: slider XP que afecta **solo a la música de fondo** (los sonidos positivo/negativo suenan siempre a volumen máximo, no dependen de este slider); al soltar el slider suena el sonido positivo como referencia.
- Música: interruptor que la detiene y la reanuda.
- Efectos: interruptor independiente del de música, justo debajo, que silencia/reactiva los sonidos positivo y negativo. Ninguno de los dos interruptores afecta al otro. Ambos alineados a la izquierda.

## Por qué

Es la cara del juego y la primera pantalla real sobre el shell de la 002: valida stores, i18n, audio y navegación integrados. Añade además las piezas de formulario XP que faltaban (input, slider, interruptor) y el primer componente pixel *cute* fuera de la estética XP, que define cómo conviven ambos estilos.

## Criterios de aceptación

### Estructura
- [x] El fondo se ve a pantalla completa, pixel nítido, sin deformaciones raras en los 5 anchos de referencia; por debajo de 1025px (móvil y tablet) se usa `landing-bg-mobile.png` en vez del panorámico, que queda solo para escritorio. (Verificado con Playwright en 375/480/768/1280/1920px.)
- [x] El botón Empezar queda centrado-abajo en cualquier ancho. Los cuatro botones (solo icono) son accesibles y ≥ 44 px en móvil; en escritorio y tablet están en fila, esquina inferior derecha; en móvil (≤480px) se apilan en columna, centrados verticalmente en el borde derecho.
- [x] Cada botón de la esquina abre su ventana XP modal y la X la cierra volviendo a la landing; solo hay una pantalla del juego montada en todo momento.

### Flujo principal
- [x] Empezar funciona sin haber abierto nunca la selección de personaje: primera visita → personaje 1 "Crumbs"; visitas posteriores → último jugador persistido.
- [x] Empezar inicializa la partida y navega a la lista de niveles.

### Personaje
- [x] Las 4 miniaturas usan los sprites reales y la selección es inequívoca; grandes y en 2 columnas en móvil/tablet, en 4 columnas (ventana más ancha) en escritorio.
- [x] Al seleccionar un personaje, el campo muestra su nombre por defecto (o el último usado); es editable; trim y máximo 16 aplicados; vacío al confirmar → restaura el nombre por defecto (tests de la lógica pura).
- [x] Los nombres por defecto son idénticos en ambos idiomas (son datos, no i18n).
- [x] Confirmar actualiza el jugador actual y sobrevive a recargar la página.

### Ranking
- [x] Récords listados con avatar, nombre, nivel máximo y fecha, ordenados según el GDD (test del orden).
- [x] Estado vacío correcto; con datos de récord presentes en el store (sembrados desde un test o desde la Playground), la lista los muestra correctamente.
- [x] (Diferido a la 004): la actualización del récord al ganar niveles se validará de punta a punta cuando exista el flujo de victoria

### Información
- [x] La guía existe en ambos idiomas, con scroll si no cabe, y no revela ninguna mecánica oculta de niveles.
- [x] ✋ Textos aprobados por Sofía en ES y EN.

### Configuración
- [x] Cambiar el idioma actualiza todos los textos visibles al instante, incluido el botón Empezar.
- [x] El volumen afecta de inmediato a la música (nivel aplicado en cada arrastre) y no a los efectos, que suenan siempre a volumen máximo; el sonido positivo de referencia solo suena al soltar, no en cada tick. El interruptor de música detiene y reanuda el loop; los cuatro ajustes sobreviven a recargar.
- [x] El interruptor de Efectos, justo debajo del de Música, silencia/reactiva positivo y negativo independientemente de la música. Ambos interruptores alineados a la izquierda.

### Calidad
- [x] Todos los textos nuevos en ambos diccionarios bajo `landing.*`; claves `game.*` intactas; los nombres por defecto NO están en los diccionarios (son datos).
- [x] `CuteButton`, `XPTextInput`, `XPSlider` y `XPToggle` añadidos a la Playground y usables con dedo y ratón. (Ratón + emulación táctil de Playwright verificados; dedo real pendiente de Sofía.)
- [ ] En iOS, enfocar el campo de nombre no provoca zoom automático. **Pendiente de Sofía en dispositivo real** (font-size ya fijado a 16px, que es la causa técnica del zoom, pero solo Safari/iOS real lo confirma).

## Fuera de alcance

- Lista de niveles real y flujo de fin de nivel → feature 004.
- Actualización del récord al completar niveles → ya existe en el store (002); aquí solo se muestra.
- Borrar/resetear el ranking desde la interfaz → no está en el GDD; al backlog si algún día interesa.
