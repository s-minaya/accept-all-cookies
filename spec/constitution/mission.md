# Misión

## Qué construimos

**Accept All Cookies**: un juego web en React, 100% pixel art con estética Windows XP, formado por 12 niveles con forma de banner de consentimiento de cookies. Cada nivel es un *dark pattern* invertido: la interfaz hace todo lo posible por impedirte pulsar **Agree**, y el jugador debe descubrir el truco. Inspirado en *Doki Doki Action Game*.

Piezas principales:

1. **Landing** — selección de personaje + nombre, ranking (localStorage), guía de información y ajustes (idioma ES/EN, volumen, música y efectos).
2. **Meta-flujo** — pantalla de selección de niveles (progreso lineal), ventanas Game Over / Level Complete con sus animaciones, pantalla de créditos.
3. **Los 12 niveles** — cada uno una mecánica autocontenida dentro de la misma ventana XP común (ver GDD, la fuente de verdad del diseño: `spec/assets/accept-all-cookies-gdd.md`).

## Para quién

- Jugadores web casuales que disfruten del humor sobre UX, privacidad y dark patterns; partidas cortas, sin registro.
- Sofía Minaya (autora): proyecto de portfolio; el código debe ser presentable y la spec, demostrable.
- Fans de juegos-broma tipo *Doki Doki Action Game*.

## Principios

- **El GDD manda** — toda mecánica, texto, color y condición de victoria/derrota sale del documento de diseño. Si el código y el GDD discrepan, se corrige el código (o se actualiza el GDD de forma deliberada, nunca por accidente).
- **Todo pixel, todo XP** — coherencia estética estricta: colores solo desde los tokens definidos, dos fuentes pixel, componentes XPWindow/XPButton reutilizados en todas partes. Nada de estilos planos modernos.
- **Un nivel = un módulo aislado** — cada nivel es un componente autocontenido con carga perezosa; solo el nivel activo está montado en el DOM. Nada de un nivel puede filtrarse a otro.
- **El engaño es del juego, no del código** — las mecánicas "trucadas" (botones ocultos, cambios instantáneos, patrones) son deterministas, están especificadas y su lógica es testeable como funciones puras.
- **Ligero y sin backend** — todo corre en el navegador; persistencia solo en localStorage; dependencias mínimas y justificadas.
- **Jugable en cualquier pantalla** — totalmente responsive (móvil pequeño → large desktop) con paridad táctil: toda mecánica de ratón tiene un equivalente táctil definido en el GDD antes de implementarse. Un nivel no está terminado si no se supera con dedo y con ratón.

## Qué NO es

- **No tiene backend ni cuentas**: el ranking es local del navegador, no global.
- **No es multijugador** ni tiene tabla de puntuaciones online.
- **No permite elegir nivel libremente**: la progresión lineal y el reinicio total al perder son decisiones de diseño, no limitaciones.
- **No usa cookies reales** más allá del chiste: solo localStorage para ranking, ajustes y la partida en curso.
