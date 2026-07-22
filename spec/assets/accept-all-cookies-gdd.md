# ACCEPT ALL COOKIES
## Documento de diseño del juego (v2 — apuntes limpios y completos)

---

# 0. Concepto general

**Accept All Cookies** es un juego web hecho en React, con estética **pixel art retro inspirada en Windows XP**, en el que el jugador debe superar 12 niveles con forma de banner de consentimiento de cookies.

Cada nivel es un *dark pattern* invertido: en lugar de manipularte para que aceptes, la interfaz hace todo lo posible por impedirte pulsar **Agree**. El jugador debe descubrir el truco de cada nivel para conseguir aceptar todas las categorías de cookies.

El juego está inspirado en **Doki Doki Action Game** (se mencionará en los créditos).

**Idiomas:** español e inglés. Se traduce **todo** el juego (UI, banners, mensajes, créditos).

---

# 1. Landing Page

La landing es el punto de entrada al juego y contiene cuatro secciones:

## 1.1 Estructura de la landing

- Imagen de fondo a pantalla completa: una versión panorámica solo para escritorio y una más vertical (`landing-bg-mobile.png`) compartida por móvil y tablet, para que el recorte no quede mal en pantallas estrechas o medianas.
- Botón Empezar (pixel art cute, con un corazón, distinto de los botones XP) en el centro-abajo: inicia la partida con el jugador actual y lleva a la lista de niveles.
- Cuatro accesos, **solo icono** (sin texto visible): Personaje, Ranking, Información y Configuración, que abren ventanas XP modales. En escritorio y tablet, en fila, esquina inferior derecha; en móvil, apilados en columna, centrados verticalmente en el borde derecho. Estilo pixel art propio "retro 8-bit" (borde negro, esquinas rectas, sombra dura), distinto tanto del sistema XP como del *cute* del botón Empezar.
- La selección de personaje muestra las 4 miniaturas, grandes (2 por fila en móvil/tablet, 4 en escritorio), y un campo de nombre editable precargado con el nombre por defecto (en inglés, nunca se traducen): 1. Crumbs (`character-1.png`), 2. Incognito (`character-2.png`), 3. Granny Agree (`character-3.png`), 4. Monster Byte (`character-4.png`). Primera visita: se juega como Crumbs sin pasos obligatorios; después, se recuerda el último jugador

## 1.2 Ranking

- Guarda el **récord histórico** por nombre de usuario: el nivel máximo alcanzado jamás por ese usuario, junto a su personaje (avatar).
- El récord es **independiente de la partida actual**: aunque el progreso de la partida se reinicie con un Game Over, el récord histórico no se pierde.
- Se almacena en **localStorage**.

Estructura de datos propuesta:

```json
{
  "ranking": [
    {
      "username": "sofia",
      "character": 2,
      "maxLevel": 9,
      "date": "2026-07-16"
    }
  ]
}
```

- El ranking se ordena por `maxLevel` descendente (y por fecha más antigua como desempate).
- Si un usuario ya existe, solo se actualiza su entrada cuando supera su propio récord.

## 1.3 Información

- Guía para el usuario sobre cómo funciona el juego: objetivo (aceptar todas las cookies), reglas generales (contador, un error reinicia el progreso, la mejor puntuación se guarda por nombre de usuario).
- Sin spoilers de las mecánicas ocultas de cada nivel.
- Se abre desde el botón de Información de la esquina de la landing, como ventana modal.

## 1.4 Ajustes

- **Idioma:** alternar entre inglés y español.
- **Volumen:** slider que controla **solo la música de fondo** (los sonidos positivo/negativo suenan siempre a volumen máximo, decisión de Sofía).
- **Música de fondo:** activar/desactivar.
- **Efectos de sonido:** interruptor independiente del de música, justo debajo, que silencia/reactiva los sonidos positivo y negativo.

---

# 2. Sistema visual y sonoro

## 2.1 Estética

Todo el juego es **100% pixel art** con estética **Windows XP**:

- Bordes redondeados clásicos.
- Barra de título azul con degradado, de `#2451E0` a `#026DE9`.
- Botón de cerrar (X) rojo `#E84443` en la esquina superior derecha, bordes redondeados, X blanca y un pequeño borde blanco alrededor del botón.
- Botones con relieve y aspecto clásico de Windows XP (nunca botones planos modernos).
- Colores y sombras propios de la interfaz de Windows XP.

## 2.2 Tipografías

Dos fuentes pixel, con jerarquías distintas:

- **UI general:** fuente pixel que evoque Tahoma — **"Pixelated MS Sans Serif"** (o equivalente). Se usa en textos de consentimiento, títulos de ventana, listas, menús.
- **Display:** fuente pixel gruesa para los textos de botones (Agree / Disagree / Check…) y para los textazos gigantes **AGREE** / **DISAGREE** de las pantallas de victoria y derrota.

## 2.3 Audio

Assets de sonido (lista cerrada):

- **Sonido positivo** (aciertos, capturas de Agree, victoria).
- **Sonido negativo** (fallos, capturas de Disagree, derrota).
- **Música de fondo** (loop, controlable desde Ajustes). Suena baja respecto a los efectos: tiene su propio multiplicador de volumen además del control de Ajustes, distinto en escritorio y en móvil (ver §14) porque el mismo número suena más alto en un altavoz de teléfono.

---

# 3. Botones

Todos los botones del juego comparten el mismo diseño base inspirado en Windows XP. Únicamente cambian el color de fondo, el texto y su comportamiento.

## 3.1 Botones Agree / Disagree

### Forma

- Rectángulo horizontal.
- Esquinas muy redondeadas (radio aproximado de 14–16 px).
- Proporción aproximada de 2.3:1 (ancho:alto).
- Apariencia ligeramente elevada, simulando un botón físico.

### Borde

Compuesto por varios bordes concéntricos:

- Borde exterior azul oscuro `#345779`.
- Segundo borde ligeramente más oscuro que el color de fondo.
- Línea inferior oscura que genera efecto de volumen.

Debe recordar a los botones clásicos de Windows XP, no a un botón plano moderno.

### Fondo y colores

Interior con fondo claro, sin efectos.

**Agree**
- Fondo: `#CDF5CE`
- Borde interior: `#7CBF89`

**Disagree**
- Fondo: `#FDD2D3`
- Borde interior: `#C7858A`
- Mismo estilo que Agree.

### Texto

- Fuente pixel display.
- Tamaño grande.
- Color blanco.
- Contorno azul oscuro grueso alrededor de cada letra.
- Ligera sombra interior para aumentar el contraste.
- Perfectamente centrado horizontal y verticalmente.

### Estados

Normal, hover, pulsado y deshabilitado.

Al pulsarse:
- Se hunde ligeramente (1–2 px).
- La sombra disminuye.

## 3.2 Botón neutro (Check / Stop / OK / Next / ???)

Mismo diseño base que Agree/Disagree pero con formato de **botón neutro del sistema**:

### Forma

- Rectángulo horizontal más pequeño (aprox. la mitad del ancho de Agree).
- Misma altura.
- Esquinas muy redondeadas.

### Borde

- Borde exterior azul oscuro `#3E587F`.
- Borde interior azul medio `#96A6D9`.

### Fondo

- Degradado vertical de blanco a `#DFE0D8` (de arriba hacia abajo).
- Sin colores llamativos: debe parecer un botón neutro del sistema operativo.

### Usos

Este estilo neutro se reutiliza en: **Check** (selección de nivel), **Stop** (nivel 5), **OK** (diálogos del nivel 1), **Next** (Level Complete), **Return to Level Selection** (Game Over), **Credits** (nivel 12) y los botones **???** del nivel 8.

---

# 4. Interfaz común (todos los niveles)

Todos los niveles usan **exactamente la misma ventana**; solo cambia el contenido interactivo del área de juego.

La ventana nunca cambia de tamaño durante la partida, salvo que el área de juego de un nivel lo requiera.

**Marco exterior de la ventana** (añadido tras el checkpoint visual de la feature 001): toda la ventana (barra de título + cuerpo) va envuelta en un borde de 4 px del mismo azul que el inicio del degradado de la barra de título (`#2451E0`), con esquinas muy redondeadas (~20 px), dando la sensación de ventana clásica de Windows. El cuerpo bajo la barra de título es beige (`#EFE7DC`); los botones inferiores se apoyan sobre ese beige, no sobre azul oscuro.

## 4.1 Barra superior

Siempre contiene:

- **Contador numérico** en la esquina superior izquierda.
- **Título del nivel** centrado.
- **Botón de cerrar (X)** en la esquina superior derecha.

Pulsar la X provoca **derrota inmediata**, en cualquier nivel y en cualquier momento.

## 4.2 Contador

- **Todos los niveles duran 100 segundos.**
- Comienza a descender al iniciarse el nivel y no se detiene nunca.
- Si llega a **0 → Game Over**.
- Excepción del nivel 1: cuando la ventana reaparece tras pulsar Disagree, el contador **se reinicia a 100**.

## 4.3 Texto de consentimiento

Debajo de la barra de título siempre hay un recuadro blanco con borde gris que contiene el texto de la categoría de cookies del nivel.

- Seleccionable pero no editable.
- **Scroll vertical interno** si el contenido supera la altura disponible.
- La altura del recuadro nunca cambia.

## 4.4 Área de juego

La mecánica de cada nivel se desarrolla dentro de un **contenedor fijo** formado por:

**Marco exterior**
- Rectángulo azul oscuro que envuelve únicamente el área de juego (no la barra de título ni los botones inferiores), separado de la barra de título por el recuadro de consentimiento y del borde de la ventana por el cuerpo beige.
- Grosor aproximado de 10–12 px.
- Completamente estático; nunca cambia entre niveles.

**Interior**
- Área rectangular de color claro `#EFE7DC` donde se renderiza la mecánica del nivel (plinko, tragaperras, tablero de flechas, cuadrícula, etc.).
- El contenido siempre queda completamente contenido dentro de este rectángulo.

## 4.5 Botones inferiores

Alineados siempre en la parte inferior de la ventana. Normalmente **Agree** y **Disagree**, aunque cada nivel puede modificar texto, color, posición o comportamiento sin alterar la estética general.

---

# 5. Pantalla de selección de niveles

Actúa como menú principal y punto de retorno tras superar o perder un nivel. **Todos los niveles se inician desde esta pantalla.**

## 5.1 Diseño

- Barra de título azul; el título es **Cookie Preferences**.
- Fondo beige `#EFE7DC`, más estrecho a los lados y abajo para dejar ver los bordes azules del contenedor.
- Lista de los 12 niveles con fondo `#FFFFFF` y borde de 1 px gris.
- Botón **Check** a la derecha de la lista.
- **No hay** contador ni botón de cerrar.

## 5.2 Lista de niveles

```
🍪 Cookie Preferences

□ Essential Cookies        (Nivel 1)
□ Analytics Cookies        (Nivel 2)
□ Personalization Cookies  (Nivel 3)
□ Advertising Cookies      (Nivel 4)
□ Social Media Cookies     (Nivel 5)
□ Cross-Site Tracking      (Nivel 6)
□ Data Sharing             (Nivel 7)
□ Third-Party Providers    (Nivel 8)
□ Fingerprinting           (Nivel 9)
□ Consent Renewal          (Nivel 10... ver nota)
□ Legitimate Interest      (Nivel 11... ver nota)
□ Accept All               (Final Boss)
```

> Nota de coherencia: en el diseño de niveles, el nivel 10 es **Legitimate Interest** (ventanas duplicadas) y el nivel 11 es **Consent Renewal** (personaje con preguntas). La lista de la pantalla de selección debe respetar el orden real de los niveles: 10 = Legitimate Interest, 11 = Consent Renewal.

Cada fila tiene tres estados posibles:

**Nivel bloqueado**
- Fondo blanco, texto negro, sin iconos.
- No puede seleccionarse.

**Nivel disponible** (el siguiente que toca completar)
- Fondo blanco, texto negro, sin marca de verificación.
- Aparece **seleccionado automáticamente**.
- Se inicia con el botón Check.

**Nivel completado**
- Fila con fondo verde.
- Icono **✓** a la derecha: blanco con bordes verdes ligeramente más oscuros.
- Permanece marcada durante toda la partida.

## 5.3 Botón Check

- Único botón de la pantalla, estilo neutro.
- Al pulsarlo se abre el **primer nivel no completado**.
- No es posible elegir libremente otro nivel: el juego siempre continúa exactamente donde corresponde.

## 5.4 Flujo al completar un nivel

1. Se muestra la ventana **Level Complete**.
2. Al cerrarla, el juego vuelve automáticamente a la pantalla de selección.
3. El nivel recién completado aparece marcado en verde con ✓.
4. El siguiente nivel queda seleccionado automáticamente.
5. El jugador pulsa **Check** para comenzar el siguiente nivel.

## 5.5 Flujo tras Game Over

1. Se muestra la ventana **Game Over**.
2. Al cerrarla, el juego vuelve a la pantalla de selección.
3. Todas las marcas verdes desaparecen.
4. El progreso de la partida se reinicia completamente.
5. **Level 1** vuelve a ser el único nivel disponible.
6. El récord histórico del ranking **no** se pierde.

## 5.6 Restricciones

- El jugador nunca puede seleccionar manualmente un nivel distinto.
- Solo existe un nivel disponible en cada momento.
- El botón Check siempre inicia el siguiente nivel pendiente.
- La pantalla de selección es obligatoria entre todos los niveles.

---

# 6. Ventana Game Over

Aparece inmediatamente cuando el jugador pierde cualquier nivel.

Se considera derrota cuando el jugador incumple la condición de victoria del nivel, pulsa un botón incorrecto (**salvo que el nivel especifique lo contrario**, como el nivel 1), agota el tiempo o cierra la ventana con la X.

El progreso de la partida se pierde completamente y el jugador comienza de nuevo desde el **Nivel 1**.

## 6.1 Fase 1 — Texto DISAGREE

En el instante de la derrota, un texto gigante aparece en el centro de la pantalla:

```
DISAGREE
```

- Ocupa aproximadamente el 70% del ancho de la ventana.
- Letras blancas, contorno azul oscuro grueso, fuente pixel display, ligera sombra.
- Aparece con fade, entra con un pequeño efecto de escala y rebota ligeramente 2–3 veces antes de detenerse.
- Suena el **sonido negativo**.
- El resto de la interfaz queda congelada durante la animación.
- Duración aproximada: **800 ms**.

## 6.2 Fase 2 — Ventana modal

Ventana modal con estética Windows XP (**mismo componente XPWindow** que el resto del juego), centrada sobre el juego, con el fondo visible detrás. No tiene botón de cerrar.

**Título:** `Disagree`

**Mensaje:**
```
You rejected the cookie preferences.

Your progress has been reset.

Click below to return to the Level Selection screen and start again from Level 1.
```

**Botón** (estilo neutro): `Return to Level Selection`

---

# 7. Ventana Level Complete

Aparece inmediatamente después de completar correctamente un nivel.

## 7.1 Fase 1 — Texto AGREE

Idéntico comportamiento al texto DISAGREE del Game Over (70% del ancho, blanco con contorno azul, fade + escala + rebotes, interfaz congelada, ~800 ms), pero con el texto:

```
AGREE
```

y el **sonido positivo**.

## 7.2 Fase 2 — Ventana modal

Mismo componente XPWindow, centrada, nivel visible pero bloqueado detrás. Sin botón de cerrar.

**Título:** `Cookies Accepted`

**Mensaje** (dinámico según el nivel):
```
You have successfully accepted:

<Nombre de la categoría>

You can now continue to the next category.
```

Caso especial del nivel 12:
```
You have successfully accepted:

Accept All

You have accepted every cookie category.
```

**Botón** (estilo neutro): `Next`
En el nivel 12 el botón es `Credits` y lleva a la pantalla de créditos.

## 7.3 Acción de Next

1. Se cierra la ventana.
2. Se actualiza el progreso del jugador (y el récord del ranking si procede).
3. Se abre la pantalla de selección de niveles con el nivel marcado en verde y el siguiente seleccionado.

## 7.4 Restricciones

- La ventana no puede cerrarse de otra forma.
- La animación AGREE siempre se reproduce antes de mostrar la ventana.
- Level Complete y Game Over comparten exactamente la misma estética; solo cambian título, mensaje y botón.

---

# 8. Reglas generales de los niveles

- Contador de **100 segundos** en todos los niveles. Si llega a cero → **Game Over**.
- Pulsar la **X** → **Game Over**.
- Pulsar un botón incorrecto → **Game Over**, salvo que el nivel especifique lo contrario (nivel 1).
- Al perder, la partida vuelve a la pantalla de selección y se reinicia desde el nivel 1.
- Al ganar, se muestra Level Complete antes de volver a la selección.

---

# 9. Niveles

## Nivel 1 — Essential Cookies

**Mecánica:** el botón **Agree** no aparece hasta que pasan **7 segundos**. Además, aunque el jugador pulse Disagree, el nivel no puede perderse por ello: las cookies esenciales "no se pueden rechazar".

**Texto:**
```
Cookie Consent

This website uses essential cookies required for the website
to function properly.

Without these cookies, some features may not work correctly.

Do you agree to the Essential Cookies?
```

**Botones:** `[ Agree ]` (verde) — invisible los primeros 7 s — y `[ Disagree ]` (rojo).

**Caso Agree:**
```
✔ Essential Cookies accepted.

You may continue.

[ OK ]
```
Se completa el nivel y se desbloquea el nivel 2.

**Caso Disagree** (excepción a la regla general — NO es Game Over):
```
Error

Essential cookies cannot be rejected.

[ OK ]
```
Al pulsar OK, la ventana del nivel vuelve a aparecer desde el principio y **el contador se reinicia a 100 segundos** (el Agree vuelve a tardar 7 s en aparecer).

**Derrota:** solo si el contador llega a 0 o se pulsa la X.

---

## Nivel 2 — Analytics Cookies

**Mecánica:** los **colores están intercambiados**. El botón Agree es **rojo** y el Disagree es **verde**. Es el nivel-tutorial de "lee el texto, no te fíes del color".

**Texto:**
```
Analytics Cookies

We use analytics cookies to understand how visitors interact
with our website.

These cookies collect information such as pages visited, time
spent on the site, click patterns and device information. The
data helps us improve performance, identify issues and provide
a better user experience.

All information is processed in accordance with our Privacy
Policy.

Do you agree to the use of Analytics Cookies?
```

**Botones:** `[ Agree ]` (ROJO) y `[ Disagree ]` (VERDE).

**Victoria:** pulsar el botón rojo que dice **Agree** → `Analytics Cookies accepted.`

**Derrota:** pulsar el Disagree verde, agotar el contador o pulsar la X.

---

## Nivel 3 — Personalization Cookies

**Mecánica:** la ventana puede **rotar 360° libremente sobre su eje central** arrastrando con el ratón. El botón **Agree** está **fuera del viewport visible**: solo entra en pantalla al rotar la ventana. Mientras tanto, en un recuadro extra (más estrecho que el del texto) **caen y rebotan decenas de botones Disagree**.

**Texto:**
```
Personalization Cookies

Personalization cookies allow us to remember your preferences,
such as language, region and display settings.

They help us provide a more personalized experience based on
your previous interactions with our website.

Do you agree to the use of Personalization Cookies?
```

**Al cargar el nivel:**
- El botón Agree no está visible (está fuera del viewport, en un lateral).
- Solo se ve un botón **Disagree**.
- En el recuadro extra empiezan a caer decenas de botones Disagree que rebotan con física.
- El jugador intenta buscar el Agree sin éxito… hasta que descubre que la ventana rota.

**Rotación:**
- Click y arrastre sobre la ventana la hace girar sobre su centro.
- Rotación libre, 360°, en ambos sentidos.
- Al rotar, el botón Agree (situado en un lateral, fuera del área visible inicial) entra en pantalla y se puede pulsar.

**Los Disagree que caen SON clicables:** pulsar cualquiera de ellos (o el Disagree fijo) es **Game Over**.

**Victoria:** pulsar el Agree oculto → `Personalization Cookies accepted.`

**Derrota:** pulsar cualquier Disagree (fijo o de los que caen), agotar el contador o pulsar la X.

---

## Nivel 4 — Advertising Cookies

**Objetivo:** rellenar completamente el botón Agree gigante con estilo visual Agree antes de que quede ocupado por el estilo Disagree (o de que acabe el contador).

**Texto:**
```
Advertising Cookies

Advertising cookies help us deliver more relevant advertisements
based on your browsing activity and interests.

These cookies may be used by us and our trusted advertising
partners to build a profile of your preferences across different
websites and services. This information may be combined with data
collected from other sources to personalize advertisements,
measure campaign effectiveness and improve our marketing services.

If you do not allow these cookies, you will still see
advertisements, but they may be less relevant to your interests.

Do you agree to the use of Advertising Cookies?
```

**Escenario:**
- Tablero tipo **Plinko** con **30 pegs** distribuidos como un Plinko clásico.
- Desde arriba aparecen continuamente pequeños botones, cada uno aleatoriamente **Agree** o **Disagree**.
- Caen con gravedad, rebotan sobre los pegs y pueden colisionar entre ellos.
- En la parte inferior, un gran botón **Agree** controlado por el jugador.

**Control:**
- El botón grande solo se desplaza horizontalmente.
- Sigue la posición del ratón o las flechas ← →.

**Botón de 6 segmentos:**
- El botón grande está dividido internamente en **6 segmentos**, todos vacíos al empezar: `□□□□□□`
- Capturar un **Agree**: rellena un segmento **empezando por la izquierda** + sonido positivo. El segmento adopta la apariencia visual completa del botón Agree (color, bordes, relieve, sombreado, tipografía).
- Capturar un **Disagree**: rellena un segmento **empezando por la derecha** + sonido negativo, con la apariencia visual completa del botón Disagree.

**Sustitución de segmentos:** los 6 segmentos son un único botón compartido por el que compiten ambos estilos. Cuando los dos colores se encuentran:
- Cada nuevo Agree sustituye el siguiente segmento ocupado por Disagree.
- Cada nuevo Disagree sustituye el siguiente segmento ocupado por Agree.

Ejemplo: `🟩🟩□□🟥🟥` + Agree → `🟩🟩🟩□🟥🟥` + Agree → `🟩🟩🟩🟩□🟥` … El botón siempre representa el equilibrio actual entre Agree y Disagree.

**Guía / slider:**
- El botón grande se mueve dentro de una guía horizontal, inicialmente **azul oscuro** `#153859`.
- La zona entre el extremo izquierdo y la posición actual del botón se pinta de **beige** `#B49E85`, y disminuye si el botón vuelve a la izquierda. Comportamiento de slider: el beige representa la posición actual, nunca deja rastro permanente.

**Física:**
- Gravedad realista, rebotes en los 30 pegs, colisiones entre botones, cada rebote modifica ligeramente la trayectoria.
- Distribución aparentemente aleatoria pero coherente con un Plinko: el jugador puede anticipar aproximadamente las trayectorias, nunca con total precisión.

**Victoria:** los 6 segmentos con estilo Agree → `Advertising Cookies accepted.`

**Derrota:** los 6 segmentos con estilo Disagree, contador a 0, o pulsar la X → `Advertising Cookies rejected.` / Game Over.

---

## Nivel 5 — Social Media Cookies

**Objetivo:** detener los tres rodillos de una tragaperras mostrando `Agree | Agree | Agree`.

**Texto:**
```
Social Media Cookies

Social media cookies enable you to connect with social platforms,
share content and personalize your experience across different
services.

These cookies may be used by us and selected third parties to
measure engagement, personalize content and deliver advertisements
based on your activity across websites and social networks.

Do you agree to the use of Social Media Cookies?
```

**Escenario:**
- Tres rodillos verticales centrados, girando a gran velocidad desde el inicio.
- Debajo de cada rodillo, un botón **Stop** (estilo neutro).
- Cada rodillo es una secuencia continua de botones Agree y Disagree con distribución aleatoria.
- Proporción por rodillo: **~40% Agree / 60% Disagree** (valor inicial ajustable en playtesting; objetivo: complicado pero no frustrante).

**Botones Stop:**
- Detienen inmediatamente su rodillo en la posición actual; el botón visible en el centro es el resultado de ese rodillo.
- Sonido de confirmación tipo tragaperras (sonido positivo si es Agree, negativo si es Disagree).
- El Stop usado se deshabilita y se oscurece.

**Rehabilitación (regla clave):** si el jugador detiene los tres rodillos y el resultado **no** es triple Agree, tras una breve pausa los rodillos **vuelven a girar** y los tres botones Stop **se rehabilitan**. El jugador puede intentarlo tantas veces como el contador le permita.

**Victoria:** tres rodillos parados mostrando `Agree | Agree | Agree` → `Social Media Cookies accepted.`

**Derrota (única):** el contador llega a 0 sin haber conseguido triple Agree → `Time expired.` También pulsar la X (→ `Cookie preferences discarded.`).

---

## Nivel 6 — Cross-Site Tracking

**Objetivo:** guiar una llave hasta un candado en un tablero de flechas. Al alcanzar el candado, se desbloquea el botón Agree.

**Texto:**
```
Cross-Site Tracking

Cross-site tracking allows us and our partners to recognize your
browser across different websites and services.

Information collected through cross-site tracking may include
pages visited, interactions, browsing behavior and device
identifiers. This data helps us understand user journeys, measure
advertising effectiveness and provide a more personalized browsing
experience across multiple websites.

Do you agree to the use of Cross-Site Tracking?
```

**Escenario:**
- Tablero de **40 columnas × 7 filas**, rodeado por casillas 1×1 grises puramente decorativas.
- El tablero es más ancho que el área de juego visible: hay **scroll horizontal** y **la cámara sigue a la llave**.
- Una llave (posición inicial fija), un candado (meta), botones Agree (deshabilitado al inicio) y Disagree.
- A la derecha, panel con cuatro botones de dirección: ↑ ↓ ← →.

**Casillas posibles:** vacía, flecha ↑, flecha ↓, flecha ←, flecha →, llave, candado.

**Movimiento:**
- Con la llave sobre una casilla **vacía**, el jugador pulsa una dirección y la llave avanza una casilla.
- Si entra en otra casilla vacía → se detiene y el jugador recupera el control.
- Si entra en una **flecha** → pierde el control y sigue automáticamente la dirección de cada flecha que pisa, encadenándose sin detenerse, hasta llegar a una casilla vacía o al candado.
- Si llega al **candado** → el candado se desbloquea y el botón **Agree** se habilita.

**Diseño del tablero:**
- El layout de flechas es **fijo, diseñado a mano**, con **una única solución**.
- Debe ser lioso pero completable.
- **El jugador nunca puede quedarse bloqueado:** todos los caminos equivocados devuelven a la llave a alguna casilla vacía desde la que se puede seguir jugando (nunca hay bucles infinitos de flechas ni callejones sin retorno).
- Patrón de diseño: tramos de flechas encadenadas (automáticos) separados por paradas en casillas vacías (los únicos momentos de decisión real del jugador).

**Victoria:** con el candado desbloqueado, pulsar **Agree** → `Cross-Site Tracking accepted.`

**Derrota:** contador a 0, pulsar Disagree o pulsar la X.

---

## Nivel 7 — Data Sharing

**Objetivo:** revelar el botón Agree oculto y pulsarlo. A simple vista solo existen dos botones Disagree.

**Texto:**
```
Data Sharing

We may share certain information with trusted partners to provide
our services, improve functionality, measure performance and
comply with legal obligations.

Shared information may include technical data, browsing activity,
device information and interactions with our website. Our partners
are required to process this information in accordance with
applicable privacy regulations.

Do you agree to Data Sharing?
```

**Botones visibles:**
- Izquierdo: **rojo**, texto `Disagree`. Botón normal: si se pulsa → `Data Sharing rejected.` → Game Over.
- Derecho: **verde**, texto `Disagree`. Si se hace un clic normal → `Data Sharing rejected.` → Game Over.

**Mecánica oculta:**
- El Disagree verde es una **cubierta** situada encima de otro botón.
- Debajo hay un segundo botón completamente oculto: mismo tamaño, mismo color verde, texto `Agree`.
- El Disagree verde puede **arrastrarse** con el ratón (mantener pulsado y desplazar en cualquier dirección).
- Mientras se arrastra, el botón superior sigue exactamente al cursor y va dejando ver progresivamente el Agree, que **permanece completamente fijo** en todo momento.
- Efecto: como retirar una tarjeta que cubre otra. Sin transformaciones, cambios de texto ni de color: simplemente se revela el botón que ya estaba debajo.

```
Antes:              Durante el arrastre:        Después:
[ Disagree ] [ Disagree ]    [ Disagree ]   [Disagree]     [ Disagree ] [ Agree ]
                                            [ Agree ]
```

**Victoria:** descubrir el Agree, soltar el Disagree y pulsar Agree → `Data Sharing accepted.`

**Derrota:** pulsar el Disagree rojo, pulsar el Disagree verde sin arrastrarlo, contador a 0 o pulsar la X → Game Over.

---

## Nivel 8 — Third-Party Providers

**Objetivo:** localizar el botón Agree, memorizar su posición durante los barajados y seleccionarlo al final (juego del trilero).

**Texto:**
```
Third-Party Providers

We work with selected third-party providers who may process your
information on our behalf to deliver services such as hosting,
analytics, advertising and customer support.

These providers may operate in different countries and are
contractually required to protect your information in accordance
with applicable data protection laws.

Do you agree to share your information with our Third-Party
Providers?
```

**Estado inicial:**
- Cuadrícula de **12 botones** (4 columnas × 3 filas), bien espaciados.
- 11 botones muestran `Disagree`; 1 botón muestra `Agree`.
- La posición del Agree se genera aleatoriamente en cada partida.

**Primera pulsación:**
- El jugador pulsa el Agree (no completa el nivel todavía).
- Todos los botones realizan simultáneamente una animación de **giro de 180°**.
- Al terminar el giro, todos adoptan el **estilo de botón neutro** (el de Check/Stop: degradado blanco → `#DFE0D8`, bordes azules) con el texto `???`.
- Desde ese momento los 12 botones son visualmente idénticos.

**Barajados** (encadenados sin pausa, estilo trilero — los botones nunca desaparecen, intercambian posiciones con movimientos fluidos):
1. Velocidad lenta, ~2 s.
2. Velocidad media, ~1,5 s.
3. Velocidad alta, ~1 s.

**Durante los barajados el jugador NO puede clicar** (los clics se ignoran / los botones están deshabilitados).

**Selección final:** al terminar el tercer barajado, todos siguen mostrando `???` y el jugador debe elegir uno.

**Victoria:** seleccionar el botón que originalmente era Agree → `Third-Party Providers accepted.`

**Derrota:** seleccionar cualquier otro botón, contador a 0 o pulsar la X → Game Over.

---

## Nivel 9 — Fingerprinting

**Objetivo:** pulsar un botón Agree. Parece un reto de reflejos, pero la solución real es descubrir que **no hay que perseguir los botones**.

**Texto:**
```
Fingerprinting

Fingerprinting allows us and our partners to identify your browser
or device by collecting information about its configuration and
characteristics.

Unlike traditional cookies, fingerprinting may rely on details such
as your browser, operating system, screen resolution, installed
fonts, language settings and other technical attributes to
recognize your device across different sessions.

Do you agree to the use of Fingerprinting?
```

**Escenario:**
- Cuadrícula de **4 columnas × 3 filas**; las 12 casillas comienzan vacías y funcionan de forma independiente.
- En cualquier momento puede aparecer un botón en una casilla, aleatoriamente **Agree** o **Disagree** con la **misma probabilidad**.

**Animación de los botones:**
- Entran desde la parte inferior de la casilla, suben rápidamente y desaparecen por arriba.
- El tiempo visible es tan corto que resulta prácticamente imposible clicarlos persiguiéndolos con el ratón.
- Continuamente aparecen nuevos botones en casillas aleatorias.

**Mecánica oculta:**
- Si el cursor permanece **completamente inmóvil** sobre una casilla durante ~**1 segundo**:
  - Los botones que aparezcan en **esa** casilla dejan de desplazarse y permanecen visibles mientras el cursor siga inmóvil.
  - El resto de casillas siguen funcionando con normalidad.
- El jugador espera pacientemente a que en su casilla aparezca un **Agree** detenido y lo pulsa.

**Victoria:** clicar un Agree detenido → `Fingerprinting accepted.`

**Derrota:** pulsar un Disagree, contador a 0 o pulsar la X → Game Over.

---

## Nivel 10 — Legitimate Interest

**Objetivo:** encontrar, entre varias ventanas idénticas, la única que contiene el botón Agree y pulsarlo.

**Texto:**
```
Legitimate Interest

We and our trusted partners may process certain personal data
based on our legitimate interests where permitted by applicable
law.

This processing may include improving our services, preventing
fraud, measuring performance and providing relevant content
without requiring separate consent in certain circumstances.

Do you agree to Legitimate Interest?
```

**Estado inicial:** una única ventana con dos botones inferiores:
- Izquierdo: rojo, `Disagree`.
- Derecho: **verde**, pero también `Disagree`.

**Mecánica principal:**
- Si el jugador arrastra la ventana por la barra de título, la ventana se desplaza normalmente **y aparece una nueva ventana idéntica** por encima, movible de forma independiente.
- Cada ventana solo puede generar una copia **una única vez**.
- El proceso continúa hasta un máximo de **7 ventanas**. A partir de ahí, moverlas ya no genera copias, pero todas siguen siendo funcionales.

**Botones:**
- Mientras existan menos de 7 ventanas, todos los botones muestran `Disagree`.
- Al aparecer la séptima ventana, se elige **aleatoriamente una** de las 7 y solo esa cambia su botón verde a `Agree`. **Las otras seis** siguen mostrando `Disagree`.
- Cada partida elige una ventana distinta al azar.

**Victoria:** localizar la ventana con el Agree y pulsarlo → `Legitimate Interest accepted.`

**Derrota:** pulsar cualquier Disagree, contador a 0 o pulsar la X **de cualquiera de las ventanas** → Game Over.

---

## Nivel 11 — Consent Renewal

**Objetivo:** responder correctamente a una serie de preguntas de un personaje asistente. La dificultad no está en entender las preguntas sino en **romper el patrón** que el propio juego crea.

**Texto:**
```
Consent Renewal

To ensure your privacy choices remain up to date, we may
periodically ask you to renew your consent.

Renewing your consent helps us confirm your current preferences
and continue providing personalized services in accordance with
applicable privacy regulations.

Do you agree to renew your consent?
```

**Escenario:**
- Botón **Disagree** rojo en la parte inferior izquierda (nunca debe usarse; pulsarlo es Game Over).
- Un **personaje asistente tipo Clippy** (asistente del sistema, NO es el personaje seleccionado por el jugador en la landing; sprite propio, placeholder durante el desarrollo) en la esquina inferior derecha.
- Del personaje sale un bocadillo de diálogo con dos botones: **No** y **Yes**. Toda la interacción ocurre en el bocadillo.

**Secuencia de preguntas** (respuesta correcta en negrita; fallar cualquiera = Game Over):

| # | Pregunta | Correcta |
|---|----------|----------|
| 1 | Are you having any trouble? | **No** |
| 2 | No, but you are having some trouble, right? | **No** |
| 3 | No, no, don't push yourself... you're having trouble, right? | **No** |
| 4 | Do you intend to agree? | **Yes** |

**Repetición:** tras acertar la cuarta, la conversación vuelve a empezar desde la primera pregunta, exactamente en el mismo orden y sin ninguna diferencia visual. La **segunda vuelta** es idéntica (No, No, No, Yes).

El truco psicológico: el jugador se acostumbra a pulsar No tres veces, y la cuarta pregunta cambia la respuesta correcta; además, la repetición completa hace dudar de si el patrón se mantiene.

**Victoria:** responder correctamente las **8 preguntas consecutivas** (dos vueltas completas) → `Consent successfully renewed.`

**Derrota:** responder mal cualquier pregunta, contador a 0, pulsar el Disagree rojo o pulsar la X → Game Over.

---

## Nivel 12 — Accept All (Final Boss)

**Objetivo aparente:** completar una barra de progreso pulsando repetidamente Agree.

**Objetivo real:** detectar el momento en que el botón cambia y **dejar de pulsar**.

**Texto:**
```
Accept All

Accepting all cookies allows us and our trusted partners to
provide the full experience, including analytics, personalization,
advertising, cross-site tracking and data sharing.

You can help us improve our services by accepting all available
categories at once.

Do you agree to Accept All?
```

**Escenario:**
- Barra de progreso horizontal sobre los botones.
- Botón **Disagree** rojo a la izquierda, **Agree** verde a la derecha.

**Barra de progreso:**
- Empieza vacía.
- Cada pulsación de Agree la aumenta una cantidad muy pequeña (sensación de que harán falta muchísimos clics).
- Si pasan **0,5 s** sin pulsar Agree, la barra decrece una pequeña cantidad.
- **Decisión de diseño documentada:** la barra es puro teatro. Nunca se completa a base de clics; su única función es inducir el clic compulsivo. Encaja con el tema del juego.

**Mecánica oculta:**
- Tras un número aleatorio de pulsaciones de Agree (**entre 15 y 35**), instantáneamente:
  - El botón Agree cambia a **Disagree**: misma posición, cambia de verde a rojo, sin animación ni transición.
  - La barra no se reinicia ni retrocede.
- La intención es que el jugador, clicando rápido en automático, pulse el Disagree sin darse cuenta.

**Victoria:** si el jugador detecta el cambio y **deja de pulsar**, tras **2 segundos** el Disagree desaparece y vuelve a ser Agree. Al pulsarlo, la barra se completa automáticamente hasta el 100% → `All cookies accepted.` → ventana Level Complete con botón **Credits** → pantalla de créditos.

**Derrota:** pulsar el Disagree en cualquier momento (el fijo de la izquierda o el convertido), contador a 0 o pulsar la X → Game Over.

---

# 10. Pantalla de créditos

Aparece tras pulsar **Credits** en el Level Complete del nivel 12. Mantiene la estética XP (puede ser una ventana XPWindow grande con scroll, o texto que sube estilo créditos de cine en pixel art).

Tono: **gracioso y un poco troll**, como si Sofía hablara directamente con quien ha llegado hasta el final. Borrador (versión inglesa; se traduce al español como todo el juego):

```
CREDITS

Wow. You actually did it.

You just spent your free time fighting for the right
to be tracked, profiled and fingerprinted.

Twelve levels. Voluntarily. Nobody forced you.

─────────────────────────────

Game design ............ Sofía Minaya
Pixel art .............. Sofía Minaya
Code ................... Sofía Minaya
Psychological warfare ... Sofía Minaya

Inspired by ............ Doki Doki Action Game

Special thanks ......... You, for proving that with
                         enough dark patterns, anyone
                         will click Agree.

─────────────────────────────

Your data is now being shared with our 847 trusted partners.

...just kidding.

The only cookies this game uses are the ones in your
localStorage. And those are just your ranking. Promise.

[ Return to Level Selection ]
```

(El texto final es un borrador: se pulirá al escribir la spec, pero el tono y la estructura son estos. El botón final devuelve a la landing / pantalla de selección con la partida reiniciada y el récord guardado en el ranking.)

---

# 11. Localización

- Idiomas: **español** e **inglés**, alternables desde Ajustes.
- Se traduce **todo**: UI, landing, textos de consentimiento de los banners, mensajes de victoria/derrota, diálogos del nivel 11, créditos.
- Los textos de este documento están escritos en su versión inglesa (canónica); las traducciones al español se producirán como parte del desarrollo.
- Agree y Disagree nunca se traducen, en ningún contexto: botones, textazos gigantes, título de la ventana de Game Over, rodillos, fichas del plinko, etc. Son piezas del juego, no texto de interfaz. Razón de diseño: "Disagree" contiene visualmente la palabra "Agree", y esa confusión es parte de la dificultad de los niveles 2, 7, 10 y 12; traducirlos a "Aceptar/Rechazar" haría el juego más fácil en español.
- El resto de botones del sistema (Check, Stop, OK, Next, Yes, No) se mantienen también en inglés por coherencia con el falso sistema operativo.

---

# 12. Persistencia (localStorage)

Tres estructuras independientes, las tres persistidas:

**Ranking (permanente):** récord histórico por usuario — ver sección 1.2. Nunca se borra con un Game Over.

**Partida actual (persistente, sobrevive a recargar):** progreso de niveles completados, nivel actual y, si hay un nivel en curso, su contador. Recargar la página **no** hace perder nada de esto: el juego retoma exactamente donde se dejó. Se reinicia por completo (incluido el contador) con cualquier Game Over.

**Ajustes:** idioma, volumen y música on/off también se persisten en localStorage.

---

# 13. Decisiones de diseño documentadas

- "Aggree" era un typo recurrente: se ha corregido a **Agree** en todo el documento.
- Los mensajes del nivel 7 dicen **Data Sharing** (antes decían por error "Legitimate Interest").
- El mensaje de victoria del nivel 6 dice **Cross-Site Tracking accepted** (antes "Third-Party Cookies").
- El nivel 10 tiene **7 ventanas** (en versiones antiguas eran 5; por eso el texto decía "las otras cuatro" — ahora son "las otras seis").
- La regla general "botón incorrecto = Game Over" admite excepciones por nivel (nivel 1).
- El contador es siempre de 100 s; el del nivel 1 se reinicia al reaparecer la ventana.
- La barra del nivel 12 es teatro intencionado.
- Los 4 personajes son solo avatar de ranking; el personaje del nivel 11 es un asistente propio tipo Clippy.
- Inspiración reconocida: **Doki Doki Action Game**.
- Agree/Disagree no se traducen nunca: la similitud visual entre ambas palabras es mecánica de juego.
- La landing no obliga a elegir personaje: Empezar funciona siempre.
- Los nombres por defecto de los personajes están en inglés y no se traducen (son datos, no interfaz).


# 14. Parámetros ajustables (para playtesting)

| Parámetro | Valor inicial |
|---|---|
| Multiplicador de volumen de la música (sobre su propio máximo, independiente del volumen general) | **Distinto por dispositivo**: escritorio 0.5, móvil/táctil 0.1. Detectado por tipo de puntero (`pointer: coarse`), no por ancho de pantalla. |
| Duración del contador (todos los niveles) | 100 s |
| Nivel 1: retardo de aparición del Agree | 7 s |
| Nivel 4: segmentos del botón | 6 |
| Nivel 4: pegs del Plinko | 30 |
| Nivel 4: ratio de spawn Agree/Disagree | 50/50 |
| Nivel 5: proporción Agree por rodillo | ~40% |
| Nivel 5: velocidad de giro de rodillos | por definir en playtesting |
| Nivel 8: duración de barajados | 2 s / 1,5 s / 1 s |
| Nivel 9: tiempo de cursor inmóvil para congelar casilla | ~1 s |
| Nivel 10: máximo de ventanas | 7 |
| Nivel 12: pulsaciones antes del switcheo | aleatorio 15–35 |
| Nivel 12: tiempo de espera para revertir el botón | 2 s |
| Nivel 12: decaimiento de la barra | cada 0,5 s sin pulsar |

# 15. Responsive y controles táctiles

El juego es **totalmente responsive** y jugable con ratón y con dedo. Un nivel no se considera terminado si no puede superarse con ambos.

## 15.1 Breakpoints

| Nombre | Rango | Referencia |
|---|---|---|
| `xs` | ≤ 375 px | iPhone SE |
| `sm` | 376–480 px | Móvil normal |
| `md` | 481–1024 px | Tablet |
| `lg` | 1025–1440 px | Desktop |
| `xl` | > 1440 px | Large desktop |

- La ventana XP ocupa casi todo el viewport en `xs`/`sm` y tiene tamaño fijo centrado en `lg`/`xl`.
- Las áreas de juego usan **resolución lógica fija + escala**: la mecánica se diseña una vez y solo cambia el factor de escala por pantalla.
- Zonas interactivas ≥ 44×44 px reales en móvil.
- El hover es siempre decorativo: ninguna mecánica depende de él.

## 15.2 Equivalencias táctiles por nivel

| Nivel | Ratón | Equivalente táctil |
|---|---|---|
| 1, 2, 5, 8, 11, 12 | Clics | Taps (sin cambios) |
| 3 — Personalization | Arrastrar para rotar la ventana | Arrastre de un dedo = misma rotación |
| 4 — Advertising | El botón sigue al cursor / flechas ← → | El botón sigue al dedo mientras se arrastra horizontalmente en cualquier punto del área de juego (no hace falta tocar el botón) |
| 6 — Cross-Site | Botones de dirección | Ya táctiles. En `xs`/`sm` el panel de flechas se coloca bajo el tablero |
| 7 — Data Sharing | Arrastrar la cubierta / clic | Mismo arrastre con el dedo. Umbral tap-vs-drag: < 8 px de desplazamiento = tap (derrota si es el Disagree verde), ≥ 8 px = arrastre |
| 9 — Fingerprinting | Cursor completamente inmóvil ~1 s sobre una casilla | **Mantener el dedo pulsado** sobre una casilla ~1 s congela sus botones. **Soltar el dedo sobre un Agree congelado = pulsarlo** (soltar sobre un Disagree congelado = Game Over; soltar sin botón congelado = nada) |
| 10 — Legitimate Interest | Arrastrar ventanas por la barra de título | Mismo arrastre con el dedo. En `xs` las ventanas se reducen para que las 7 quepan solapadas (el caos resultante es parte del nivel) |

## 15.3 Entrada unificada

Toda la entrada se gestiona con **Pointer Events** (un solo código para ratón, dedo y stylus). El umbral tap-vs-drag y el tiempo de "puntero inmóvil" son parámetros ajustables globales.

## 15.4 Parámetros ajustables (añadidos)

| Parámetro | Valor inicial |
|---|---|
| Umbral tap vs drag | 8 px |
| Resolución lógica de las áreas de juego | 640×360 (por confirmar en la feature 001) |
| Tamaño mínimo táctil | 44×44 px |
