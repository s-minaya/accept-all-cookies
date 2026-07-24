# 006 · Nivel 2 — Analytics Cookies

**Estado:** implementada

## Qué hace

Implementa el Nivel 2 (GDD §9, Nivel 2) y sustituye su hueco del registro. La mecánica es el engaño más simple del juego: **los colores de los botones están intercambiados**.

### Mecánica

- Mismo patrón de layout que el nivel 1 (excepción del GDD §4.3: sin tablero propio, el texto de consentimiento de Analytics Cookies ocupa el interior del marco azul con scroll interno; botones en el pie de la ventana vía `useLevelFooter`).
- Dos botones desde el primer segundo, sin trucos de aparición:
  - **`Agree` en ROJO** — con todo el estilo visual del botón Disagree (fondo, bordes, relieve).
  - **`Disagree` en VERDE** — con todo el estilo visual del botón Agree.
- No hay ninguna otra mecánica: el nivel se gana leyendo.

### Victoria y derrota

- **Victoria**: pulsar el botón rojo que dice **Agree** → `onWin()` → flujo estándar con la categoría "Analytics Cookies".
- **Derrota**: pulsar el botón verde que dice **Disagree** (`onLose` con el motivo de botón incorrecto), contador a 0 o X — las dos últimas ya gestionadas por el shell.

## Por qué

Es el nivel-tutorial del principio rector del juego ("no te fíes de la interfaz") y la razón por la que Agree/Disagree no se traducen (GDD §11): el jugador que viene del nivel 1 con la memoria muscular de "pulsa el verde" se estrella aquí si no lee. Además valida que la receta de la 005 se copia limpia: si esta feature no sale en poco tiempo y con casi cero código nuevo, el molde tiene un problema.

## Criterios de aceptación

- [x] El hueco 2 del registro carga este nivel (chunk propio en el build); los huecos 3–12 siguen con el nivel de prueba.
- [x] El botón Agree se renderiza con la variante visual *disagree* completa (rojo, bordes, relieve y sus 4 estados) y el Disagree con la variante *agree* completa — sin estilos nuevos ni componentes nuevos.
- [x] Los textos de los botones siguen saliendo de `game.agree` / `game.disagree` (nunca de claves nuevas).
- [x] Pulsar el Agree rojo gana con el flujo estándar y la categoría correcta; pulsar el Disagree verde pierde con el flujo estándar; contador a 0 y X pierden como siempre.
- [x] Texto de consentimiento en ambos diccionarios bajo `levels.2.*`, con scroll interno si no cabe.
- [x] `paused` congela el nivel; recargar a mitad de nivel lo retoma jugable y recargar con desenlace pendiente muestra la modal correspondiente (comportamiento del fix de la 004, verificado también aquí).
- [x] Partida jugada entera ganando (verificado con Playwright) y perdiendo (test automatizado); jugable con dedo y ratón; correcto en los 5 anchos y en móvil real vía Pages. Confirmado por Sofía.

## Fuera de alcance

- Niveles 3–12 → features 007–016.
- Cualquier variante nueva de `XPButton` — la mecánica se resuelve con las variantes existentes; si no fuera así, sería señal de un problema en el sistema de diseño, no una tarea de este nivel.
