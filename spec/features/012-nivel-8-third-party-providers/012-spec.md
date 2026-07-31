# 012 · Nivel 8 — Third-Party Providers (trilero)

**Estado:** implementada

## Qué hace

Implementa el Nivel 8 (GDD §9, Nivel 8): una cuadrícula de **12 botones** con **11 Disagree y 1 Agree** en posición aleatoria. Al pulsar el Agree, los doce **giran 180°**, se vuelven idénticos (estilo neutro, texto `???`) y se **barajan tres veces** a velocidad creciente. Al terminar, el jugador debe señalar dónde quedó el Agree original.

### Layout

- Texto de consentimiento de Third-Party Providers **dentro del marco azul**, ajustado a su contenido (patrón as-built).
- La **cuadrícula** se publica vía `useLevelBoard` debajo del marco, sin marco propio: **4 columnas × 3 filas** en tablet/escritorio y **3 columnas × 4 filas** en móvil (xs/sm) — 12 casillas en ambos casos, con separación suficiente para que los recorridos del barajado se lean.
- **Sin pie de ventana**: los botones de la cuadrícula son toda la interacción.

### Fases del nivel

1. **Reveal** — 11 botones `Disagree` (variante disagree) y 1 `Agree` (variante agree) en posición aleatoria (PRNG con semilla, `src/utils/prng.ts`).
2. **Flip** — al pulsar el Agree: los 12 giran 180° **a la vez** (~400 ms, parámetro) y quedan todos en **estilo neutro** con el texto `???`. Suena `coin.mp3` una vez (adición pequeña, vetable).
3. **Barajado** — tres rondas encadenadas sin pausa: **lenta ~0,8 s**, **media ~0,55 s**, **rápida ~0,35 s** (GDD). Los botones nunca desaparecen: intercambian posiciones con movimientos fluidos, estilo trilero. **Durante todo el barajado el input se ignora** (los botones no responden ni por ratón, ni por dedo, ni por teclado).
4. **Elección** — todos siguen mostrando `???`; el jugador pulsa uno.

### Victoria y derrota

- **Victoria**: el botón elegido es el que originalmente era Agree → `onWin()` inmediato (la elección es el acto deliberado; precedente del nivel 5) → flujo estándar con "Third-Party Providers".
- **Derrota**: elegir cualquier otro (`failed`), contador a 0, o X.
- Pulsar uno de los 11 Disagree visibles durante el reveal también es derrota inmediata — regla madre del juego, coherente con los niveles 2, 3 y 7; anotado en el GDD.

### Tras el flip, todos son idénticos

- El estilo neutro es el mismo de Check/Stop (GDD §3.2): ni un píxel distingue al que era Agree.
- Los botones no exponen su identidad al DOM (nada de `data-agree`, ni orden estable de nodos que lo delate): el estado real vive en la lógica del nivel, y el DOM solo publica posición. Accesibilidad: cada botón se anuncia por su casilla ("opción 7 de 12"), nunca por su contenido.

### Pausa y recarga

- `paused` congela el flip, el barajado (las transiciones se detienen donde estén y se reanudan sin saltos) y el input.
- Recargar a mitad: contador restaurado; el nivel **vuelve a la fase reveal con una posición nueva del Agree** (efímero, como el resto). Con desenlace pendiente, la modal.

## Por qué

Es el nivel de memoria del juego y el más "de feria" — el único donde el jugador no puede hacer nada mal salvo despistarse. Técnicamente es una máquina de estados con animación coreografiada: nada de física, nada de azar durante el juego (todo el azar se consume al montar, con semilla), así que es **determinista y testeable de punta a punta** — el barajado completo se puede verificar sin navegador.

## Criterios de aceptación

### Fases y mecánica
- [x] Reveal: 11 Disagree + 1 Agree, posición del Agree aleatoria en cada partida (test con semillas distintas).
- [x] Pulsar el Agree dispara el flip de los 12 a la vez y todos quedan en estilo neutro con `???`; ninguno delata su identidad (ni visualmente ni en el DOM).
- [x] Tres rondas de barajado encadenadas con sus duraciones (~0,8 / ~0,55 / ~0,35 s); los botones intercambian posiciones sin desaparecer.
- [x] Durante el flip y las tres rondas, **ningún** input tiene efecto (ratón, dedo o teclado); tras la última, la elección vuelve a estar disponible.
- [x] La lógica de permutación es pura y determinista: dada una semilla, la posición final del Agree es reproducible y coincide con la que el componente considera ganadora (test que simula las tres rondas y comprueba la trazabilidad del Agree).

### Victoria y derrota
- [x] Elegir el botón que era Agree → victoria con el flujo estándar y la categoría correcta; elegir otro → derrota estándar.
- [x] Pulsar un Disagree en la fase reveal es derrota.
- [x] Contador a 0 y X pierden en cualquier fase, incluido a mitad de barajado (heredado de `LevelHost`, sin que el nivel los intercepte).

### Integración y calidad
- [x] Hueco 8 sustituido con chunk propio (sin matter.js); `levels.8.*` en ambos diccionarios; PRNG compartido reutilizado (`src/utils/prng.ts`).
- [x] Cuadrícula 4×3 en md+ y 3×4 en xs/sm, botones ≥ 44 px, sin scroll en 375 px; los recorridos del barajado se ven completos dentro del área.
- [x] El barajado no re-renderiza el árbol por frame: posiciones por custom property escritas por ref (no por `transition` CSS — desviación de `012-plan.md`, ver su nota; el reloj de fases interpola él mismo el progreso 0..1 por fotograma, lo que además simplifica `paused` a "dejar de escribir", sin el riesgo de "congelar una transición CSS a medio camino" que el plan señalaba).
- [x] `paused` congela flip, barajado e input y reanuda sin saltos; recarga a mitad (reveal nuevo, contador restaurado) y con desenlace pendiente (modal).
- [x] Cleanup total al desmontar (timers de fase, listeners) + test de no-fugas.
- [x] Partida entera ganando y perdiendo (verificado con Playwright, fijando `Math.random` a un valor conocido); dedo y ratón; 5 anchos.
- [x] ✋ Checkpoint de Sofía: legibilidad y velocidad aprobadas ("genial") tras subir la velocidad del barajado dos veces (2/1,5/1 s → 1,2/0,9/0,6 s → 0,8/0,55/0,35 s).

## Fuera de alcance

- Pistas o ayudas para seguir el botón → el nivel es exactamente eso.
- Variar el número de barajados o de botones por dificultad → los valores del GDD, parametrizados; retoques en la 017.
- Niveles 9–12 → features 013–016.
