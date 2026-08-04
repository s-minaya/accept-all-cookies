<div align="right">
  <sub>Español · <a href="README.en.md">English</a></sub>
</div>

<div align="center">
  <img src="src/assets/images/favicon.png" width="32" alt="" />

  # Accept All Cookies

  ### Un banner de cookies que hará todo lo posible por que NO puedas pulsar "Agree" (◞‸◟)

  **[▶ Jugar en GitHub Pages](https://s-minaya.github.io/accept-all-cookies/)**

  <img src="src/assets/images/ui/heart.png" width="16" alt="" />　<img src="src/assets/images/ui/heart.png" width="16" alt="" />　<img src="src/assets/images/ui/heart.png" width="16" alt="" />
</div>

<br />

## Demo

<div align="center">
  <img src=".github/demo.gif" width="480" alt="Partida real de Accept All Cookies, recorriendo varios niveles" />
</div>

<br />

## Por qué lo construí ♡

Todo el mundo ha cerrado un banner de cookies sin leerlo — clic, clic, siguiente, sin pensar. Este
proyecto nació de darle la vuelta a esa fricción tan familiar: en vez de sufrir el *dark pattern*,
lo juegas.

La chispa concreta llegó al terminar el curso **Programa con Agentes**, de **BIG School**. Quería un
proyecto real donde aplicar lo aprendido — no un ejercicio de clase, sino algo mío de principio a
fin, pensado, diseñado y jugado de verdad. Y entonces me acordé de ***Doki Doki Action Game***: uno
de esos momentos en los que estás viendo algo y por dentro piensas *"hmmm... esto se podría programar
perfectamente"* (灬º‿º灬)♡. Así que me puse manos a la obra.

Me gusta mimar mis proyectos: dibujo yo misma los iconos, los personajes, las pantallas de la landing
— no me conformo con que *funcione*, quiero que se sienta cuidado. Y entre que me encantan los
videojuegos y me encanta programar, este proyecto fue la excusa perfecta para juntar ambas cosas en
algo con sentido: doce niveles, doce técnicas reales de manipulación de interfaces —el botón que se
mueve, el "Agree" escondido entre iguales, el contador que castiga la duda— convertidas cada una en
un puzle que hay que desactivar a propósito.

Técnicamente, también era la excusa perfecta para construir algo pequeño pero *terminado de verdad*:
doce mecánicas distintas son doce problemas de interacción distintos (física, temporización,
animación, estado compartido) dentro de las mismas reglas visuales estrictas — y documentar todo el
proceso con Spec Driven Development en vez de improvisar sobre la marcha.

<br />

## Stack ⋆｡°✩

- **React 18** + **TypeScript** (estricto) sobre **Vite**.
- **Zustand** para el estado global (partida, ajustes, ranking, personaje), persistido en `localStorage`.
- **matter.js**, solo en los niveles 3 y 4 (lluvia de física y Plinko), importado dinámicamente dentro
  de su propio chunk — el resto del juego nunca lo carga.
- **Sass** (CSS Modules + BEM) — cero CSS-in-JS, cero framework de utilidades.
- **Vitest** + **Testing Library** para la lógica y los componentes; **Playwright** para QA de
  navegador real (responsive, táctil, accesibilidad).
- **GitHub Actions** → **GitHub Pages**, build 100% estática, sin backend.

<br />

## Funcionalidades ✧

- **12 niveles, 12 mecánicas distintas** — nada de plantillas reutilizadas con skins diferentes:
  - Física real con `matter.js` (lluvia de rechazos que hay que esquivar; un Plinko que decide el veredicto).
  - Un tablero de flechas con **solución única, verificada por script** (`spec/tools/validate-level6.mjs`).
  - Una tragaperras con rodillos por física de scroll y reintentos infinitos hasta acertar.
  - Un trilero de 12 botones que se barajan en vivo sin que la animación y la "verdad" puedan discrepar nunca.
  - Una ventana que se duplica la primera vez que la arrastras (después, solo se mueve), hasta 7 copias idénticas.
  - Un interrogatorio con Sans, de Undertale, voz en bucle y un patrón que se rompe justo cuando bajas la guardia.
  - Una barra de progreso teatral que castiga el clic compulsivo.
- **Meta-flujo completo**: selección de personaje, ranking local, progresión lineal con reinicio total
  al perder, pantalla de créditos con confeti 🎉.
- **Español / inglés** completos, incluida la broma deliberada de que "Agree"/"Disagree" son
  *idénticos* en ambos idiomas (parte de la mecánica de algún nivel, no un descuido (¬‿¬) ).
- **100% responsive**, de un iPhone SE a un monitor 1920px, con paridad táctil real: todo lo que se
  juega con ratón tiene su equivalente exacto con el dedo.
- **`prefers-reduced-motion` respetado** en las animaciones decorativas, sin alterar ninguna regla de juego.
- Un error de red al cargar un nivel muestra un aviso XP con salida, nunca una pantalla en blanco.

<br />

## Instalación y ejecución local ⌨︎

```bash
git clone https://github.com/s-minaya/accept-all-cookies.git
cd accept-all-cookies
npm install

npm run dev      # entorno local (Vite)
npm run test     # Vitest
npm run lint     # ESLint + Prettier
npm run build    # build de producción (incluye una comprobación de higiene del bundle)
```

<br />

## Estructura de carpetas ⌇

```
accept-all-cookies/
├── spec/                    # Spec Driven Development: la fuente de verdad del proyecto
│   ├── constitution/        #   misión, stack, roadmap — las reglas que no cambian por feature
│   ├── features/            #   spec + plan + tareas de cada una de las 17 features
│   ├── assets/               #   el GDD (diseño completo del juego) y el tablero verificado del nivel 6
│   └── tools/                #   scripts de validación (tablero del nivel 6, higiene del build)
├── src/
│   ├── levels/               # un directorio autocontenido por nivel (level01 … level12)
│   │   └── levelNN/          #   componente + lógica pura testeable + estilos, con carga perezosa
│   ├── app/                  # shell del juego: enrutado por estado, flujo de victoria/derrota
│   ├── components/           # sistema de diseño (xp/, cute/) reutilizado en todo el juego
│   ├── state/                # stores de Zustand + la única capa autorizada a tocar localStorage
│   ├── i18n/                 # diccionarios ES/EN
│   └── playground/           # arnés del sistema de diseño, solo en desarrollo (?playground)
└── .github/workflows/        # build + test + deploy automático a GitHub Pages
```

<br />

## Decisiones técnicas interesantes 🔧

- **Un canal único nivel → shell (`hostChannel.ts`)**: ningún nivel toca la ventana, el contador o la
  navegación directamente. Publica su tablero y sus botones a través de un puñado de ranuras
  tipadas, y el shell decide cómo y cuándo montarlas. Añadir un nivel nuevo nunca implica tocar el shell.
- **El tablero del nivel 6 se genera a mano y se verifica con un script aparte**
  (`validate-level6.mjs`): comprueba que tiene solución única, que ninguna cadena de flechas sale del
  tablero ni forma un bucle, y que el jugador nunca puede quedarse bloqueado. Editar el tablero sin
  pasar el validador está prohibido por convención del propio repo.
- **Un chunk de JS por nivel, cargado perezosamente**: solo el nivel activo está montado en el DOM en
  todo momento; `matter.js` (~85KB) vive en un chunk compartido que solo los niveles 3 y 4 llegan a
  descargar. El resto del juego ni lo toca.
- **Animaciones por referencia, no por estado de React**: los niveles con movimiento continuo (rodillos,
  ventanas arrastradas, el barajado del trilero) escriben su posición directamente en el DOM vía
  `ref`/custom properties CSS en cada fotograma de `requestAnimationFrame`, en vez de disparar un
  render de React 60 veces por segundo. `paused` se resuelve dejando de escribir, sin ningún estado
  especial de "congelado".
- **Resolución lógica + escala, no CSS responsive por breakpoint**: cada área de juego con física o
  tablero se diseña sobre un lienzo lógico fijo y el shell lo escala entero con `transform: scale()`
  según el viewport real. La física y las coordenadas nunca tienen que saber en qué pantalla están.
- **Toda mecánica "trucada" es una función pura y testeada**: el barajado del trilero, el guion de la
  trampa del nivel 12, la solución del tablero de flechas… nada de esto vive en un `useEffect`
  irreproducible. Se puede verificar sin abrir un navegador, y de hecho se verifica: más de 600 tests.

<br />

## Cómo se construyó: SDD + Claude Code ⚙︎

Todo el proyecto siguió **Spec Driven Development**: nada se programó sin que existiera antes, en
`spec/features/NNN-nombre/`, una `spec.md` (qué hace y por qué), un `plan.md` (cómo se implementa, qué
se descartó y por qué) y una `tasks.md` (el desglose, marcado a medida que se completaba). El diseño
completo del juego —cada mecánica, texto, color y condición de victoria— vive en un único documento,
el GDD (`spec/assets/accept-all-cookies-gdd.md`), que manda sobre el código: si alguna vez discreparon,
se paraba a preguntar en vez de improvisar una interpretación.

Este repositorio se construyó junto con **Claude Code**, con reglas explícitas por escrito
(`AGENTS.md`) en vez de instrucciones sueltas cada vez: convenciones de código, límites duros del
stack (qué puede usar física, dónde vive cada cosa, qué nunca se hardcodea) y el propio flujo de
trabajo SDD. Lo que se delegó fue la implementación feature a feature sobre specs ya aprobadas, la
batería de tests, y las rondas de QA con Playwright (responsive, táctil, accesibilidad). Lo que se
quedó en manos propias: cada decisión de diseño y de mecánica (el GDD es mío), cada checkpoint jugado
y aprobado a mano antes de cerrar una feature, y la palabra final sobre cualquier cosa que tocara cómo
se *siente* jugar. El resultado no es "until it compiles": cada una de las 17 features tiene su
ronda de revisión jugada de verdad, muchas con dos, tres o cuatro vueltas de ajustes hasta que el
truco caía bien.

<br />

## Roadmap ⋆⭒˚｡⋆

- **Más niveles.** 12 es el punto de partida, no el techo — el shell y el `hostChannel` ya están
  pensados para que sumar un nivel nuevo sea "escribir la mecánica", no "tocar medio juego". La lista
  de ideas de dark patterns pendientes ya es más larga que el juego actual.
- **Orden aleatorio de niveles entre partidas**, para que cada vuelta se sienta distinta incluso para
  quien ya se lo sabe de memoria.
- **Más personajes jugables**, dibujados a mano como el resto del arte del juego — quiero que elegir
  personaje sea una decisión con personalidad, no un selector de skins.
- **Sonido y música propios.** Ahora mismo todos los sonidos los he sacado de una página sin licencias, mi mejor amigo es compositor y ya mismo está pensando en algo...
- **Accesibilidad ampliada** más allá de `prefers-reduced-motion`: navegación completa por teclado y
  soporte de lector de pantalla en el meta-flujo (menús, ranking, créditos).

<br />

## Créditos e inspiración ⁺˚*･༓☾

Inspirado en ***Doki Doki Action Game***.

Aparición especial: **Sans © Toby Fox** (*Undertale*) — homenaje sin ánimo de lucro.

<br />

## Contacto ✉︎

- LinkedIn: [linkedin.com/in/sofia-minaya](https://www.linkedin.com/in/sofia-minaya/)
- Portfolio: [s-minaya.github.io/sofia-minaya-portfolio](https://s-minaya.github.io/sofia-minaya-portfolio/)
- Correo: minaya.sofia@gmail.com

<div align="center">
  <img src="src/assets/images/ui/heart.png" width="20" alt="" />
  <br />
  <sub>╰(*≧ω≦*)╯ gracias por leer hasta aquí — ahora ve a intentar pulsar "Agree"</sub>
</div>