# 014 · Nivel 10 — Legitimate Interest — Plan

## Enfoque

El nivel es un **modelo de ventanas puro** (lista de ventanas con posición, si ya parió copia, y cuál lleva el Agree) más una capa de render nueva. El orden de trabajo pone primero lo arquitectónico (la ranura `overlay` del canal, con los niveles anteriores en verde) y luego la mecánica, que es sencilla en cuanto la capa existe. La regla de oro de la feature: **una sola ruta de render para las siete ventanas**, porque cualquier diferencia visual entre la original y las copias delata el truco.

## Implementación

1. **Ranura `overlay` en el canal** — `hostChannel.ts` gana `overlay: ReactNode` + `useLevelOverlay(nodo)` (mismo patrón que `useLevelBoard`, con `useLayoutEffect` para no reintroducir el flash de montaje). `LevelHost` la renderiza a pantalla completa por encima de la ventana. Tests del canal + los niveles 1–9 en verde antes de seguir.
2. **Modelo puro** — `src/levels/level10/windows.ts` (+ tests): `WindowState { id, x, y, hasSpawned }`, `spawnFrom(id)` (respeta "una copia por ventana" y el tope de 7), `clampToViewport(pos, size, viewport)`, y `pickAgreeWindow(seed, ids)` que se dispara al llegar a 7. Tests: tope exacto de 7, una copia por ventana, clamping en las cuatro esquinas, sorteo reproducible por semilla y disperso entre semillas.
3. **Componente de ventana** — `src/levels/level10/LevelWindow.tsx`: envuelve `XPWindow` con **exactamente** las props que usa `LevelHost` (título del nivel, contador, X, texto en el marco, pie) y un `renderFooter(windowId, isAgree)` compartido. Es el único sitio donde se decide cómo se ve una ventana de este nivel.
4. **Ventana nº 1 (la del host)** — el nivel publica su traslación en `windowTransform` (`translate(Xpx, Ypx)`, misma ranura que la rotación del nivel 3) y su pie por `useLevelFooter`, usando **el mismo `renderFooter`** que las copias. La nº 1 no se renderiza dos veces: se mueve, no se clona a sí misma en el overlay.
5. **Copias 2–7** — el nivel publica en `overlay` la lista de `LevelWindow` posicionadas por custom property escrita por ref (cero re-render por frame durante el arrastre, patrón de 009–012). El componente que posiciona es el mismo que se monta (lección de 010/011/012/013).
6. **Arrastre** — `usePointer` sobre la barra de título de cada ventana: al confirmarse el drag (8 px) se llama a `spawnFrom(id)` (si procede) y se empieza a mover la ventana arrastrada; la posición se aplica imperativa y se guarda en estado solo al soltar.
7. **Registro e i18n** — hueco 10 sin `consentKey`; `levels.10.*` en ambos diccionarios.
8. **GDD** — §14: tope de ventanas (7) y nada más (el resto son constantes de layout); anotar la decisión de dónde nace la copia.
9. **QA** — llegar a 7 duplicando; encontrar el Agree y ganar; perder por Disagree de una copia, por X de una copia y por contador; `paused` a medio arrastre; recarga; 5 anchos; móvil real.

## Decisiones

- **La ventana del host es la nº 1; las copias van en `overlay`** — mantiene intacto el contrato (el nivel sigue viviendo dentro de su `XPWindow`, con su contador y su X reales) y añade la capacidad mínima necesaria. Descartado: ocultar la ventana del host y pintar las siete en el overlay (más simétrico, pero exige un modo "sin ventana" en `LevelHost` que ningún otro nivel necesita y tira a la basura el contador/X del host).
- **Un único `LevelWindow` + un único `renderFooter` para las siete** — la indistinguibilidad no se consigue "teniendo cuidado", se consigue no teniendo dos rutas de render. Es el mismo razonamiento que el test de indistinguibilidad del nivel 8.
- **La copia nace donde estaba la ventana al empezar el arrastre** — hace legible la mecánica ("me llevo esta y queda otra debajo"). Descartado: nacer desplazada en cascada (parecería un bug de la aplicación en vez de una duplicación) o en posición aleatoria (caos ilegible).
- **Apilado por orden de creación, sin traer al frente** — traer al frente la ventana arrastrada exigiría que la nº 1 pudiera subir por encima del overlay, lo que rompe la arquitectura por un detalle estético. Que la nº 1 esté siempre al fondo no filtra información útil: el Agree se sortea al azar entre las siete, así que la original no es ni más ni menos probable.
- **Clamping al viewport** — mismo criterio que la cubierta del nivel 7: una ventana perdida fuera de pantalla podría llevarse el Agree con ella y convertir el nivel en injugable.
- **Todas las ventanas comparten contador** — son copias de la misma ventana; además, mantener siete contadores distintos exigiría siete relojes y contradiría que el contador es del shell.
- **Sin animación al nacer una copia** — el GDD las quiere idénticas y sin aviso; una animación señalaría "esta es nueva" y ayudaría a llevar la cuenta.

## Riesgos

- **La ventana nº 1 se ve distinta de las copias** (padding del host, `fillHeight`, wrappers) y delata cuál es la original — mitigación: `LevelWindow` como única ruta de render y una comprobación explícita en QA comparando el marcado de la nº 1 con el de una copia; si el host añade envoltorios inevitables, se replican en el overlay.
- **Rendimiento con siete ventanas y siete textos de consentimiento** — mitigación: son nodos estáticos; nada se anima por frame salvo la ventana en arrastre; si sufre en móvil, el texto de las copias puede compartirse por CSS, no por duplicación de nodos (último recurso, con el ojo puesto en no romper la indistinguibilidad).
- **Caos ingobernable en 375 px** (siete ventanas casi a pantalla completa) — es el efecto buscado, pero debe seguir siendo jugable: criterio de aceptación explícito de que todas son alcanzables; si no lo son, el dial es reducir el tamaño de ventana en xs para este nivel (no el número de ventanas, que es mecánica).
- **El arrastre de una ventana dispara el clic de un botón** — mitigación: el umbral de 8 px de `usePointer` ya separa tap de drag, y el arrastre solo se engancha a la barra de título; QA táctil específico.
- **Duplicar `XPWindow` fuera de `LevelHost` destapa suposiciones ocultas** (estilos que asumen un único `XPWindow` en la página, ids duplicados, `z-index` de la modal de fin) — mitigación: revisión explícita del CSS de `XPWindow` en busca de selectores dependientes de contexto y verificación de que la modal de victoria/derrota sigue apareciendo por encima de las siete.
