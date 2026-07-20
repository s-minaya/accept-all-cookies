# 003 · Landing

**Estado:** propuesta

## Qué hace

Convierte la pantalla placeholder de la landing en la entrada real del juego, con el diseño definido por Sofía:

- **Fondo**: la imagen de Sofía (`landing-bg.png`) a pantalla completa, pixel nítido.
- **Botón Empezar**: en el centro-abajo de la pantalla. **No es un botón XP**: es un botón pixel art *cute*, con el texto y un **corazón pixel** al lado. Nuevo componente del sistema de diseño (`CuteButton`). Su texto se traduce con normalidad ("Empezar" / "Start") — la regla de no traducir solo aplica a los botones del falso sistema operativo (`game.*`), y este es interfaz propia del juego.
- **Esquina inferior derecha**: cuatro botones pequeños — **Personaje**, **Ranking**, **Información** y **Configuración** — que abren cada uno una ventana XP modal sobre el fondo, con su X para cerrar (aquí la X solo cierra la ventana: no estamos en un nivel).

### Flujo principal

Pulsar **Empezar** inicia la partida con el jugador actualmente seleccionado y lleva directamente a la lista de niveles. **No es obligatorio pasar por la selección de personaje**: en la primera visita el jugador por defecto es el personaje 1 con su nombre por defecto; en visitas posteriores, el último personaje y nombre usados (persistidos).

### Ventana Personaje

- Cuadrícula con las **miniaturas de los 4 personajes** (sprites reales); el seleccionado queda claramente resaltado.
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

- La guía del juego (GDD §1.3), en ES/EN: objetivo, reglas generales (contador de 100 s, el botón X en los niveles provoca derrota, perder reinicia el progreso, el ranking es por nombre de usuario) y controles básicos.
- **Sin spoilers**: describe *qué hace* el juego, nunca *cómo se gana* un nivel ni sus mecánicas ocultas.
- Scroll vertical interno si el texto no cabe.

### Ventana Configuración

- Idioma ES/EN: el cambio se aplica al instante en todo lo visible.
- Volumen: slider XP que afecta inmediatamente a efectos y música (la música conserva su multiplicador); al soltar el slider suena el sonido positivo como referencia.
- Música: interruptor que la detiene y la reanuda.

## Por qué

Es la cara del juego y la primera pantalla real sobre el shell de la 002: valida stores, i18n, audio y navegación integrados. Añade además las piezas de formulario XP que faltaban (input, slider, interruptor) y el primer componente pixel *cute* fuera de la estética XP, que define cómo conviven ambos estilos.

## Criterios de aceptación

### Estructura
- [ ] El fondo se ve a pantalla completa, pixel nítido, sin deformaciones raras en los 5 anchos de referencia.
- [ ] El botón Empezar queda centrado-abajo y los cuatro botones de la esquina inferior derecha son accesibles y ≥ 44 px en móvil.
- [ ] Cada botón de la esquina abre su ventana XP modal y la X la cierra volviendo a la landing; solo hay una pantalla del juego montada en todo momento.

### Flujo principal
- [ ] Empezar funciona sin haber abierto nunca la selección de personaje: primera visita → personaje 1 "Crumbs"; visitas posteriores → último jugador persistido.
- [ ] Empezar inicializa la partida y navega a la lista de niveles.

### Personaje
- [ ] Las 4 miniaturas usan los sprites reales y la selección es inequívoca.
- [ ] Al seleccionar un personaje, el campo muestra su nombre por defecto (o el último usado); es editable; trim y máximo 16 aplicados; vacío al confirmar → restaura el nombre por defecto (tests de la lógica pura).
- [ ] Los nombres por defecto son idénticos en ambos idiomas (son datos, no i18n).
- [ ] Confirmar actualiza el jugador actual y sobrevive a recargar la página.

### Ranking
- [ ] Récords listados con avatar, nombre, nivel máximo y fecha, ordenados según el GDD (test del orden).
- [ ] Estado vacío correcto; tras superar un récord, el ranking lo refleja al volver a la landing.

### Información
- [ ] La guía existe en ambos idiomas, con scroll si no cabe, y no revela ninguna mecánica oculta de niveles.
- [ ] ✋ Textos aprobados por Sofía en ES y EN.

### Configuración
- [ ] Cambiar el idioma actualiza todos los textos visibles al instante, incluido el botón Empezar.
- [ ] El volumen afecta de inmediato a música pero no a los efectos, con sonido de referencia al soltar; el interruptor de música detiene y reanuda el loop; los tres ajustes sobreviven a recargar.

### Calidad
- [ ] Todos los textos nuevos en ambos diccionarios bajo `landing.*`; claves `game.*` intactas; los nombres por defecto NO están en los diccionarios (son datos).
- [ ] `CuteButton`, `XPTextInput`, `XPSlider` y `XPToggle` añadidos a la Playground y usables con dedo y ratón.
- [ ] En iOS, enfocar el campo de nombre no provoca zoom automático.

## Fuera de alcance

- Lista de niveles real y flujo de fin de nivel → feature 004.
- Actualización del récord al completar niveles → ya existe en el store (002); aquí solo se muestra.
- Borrar/resetear el ranking desde la interfaz → no está en el GDD; al backlog si algún día interesa.
