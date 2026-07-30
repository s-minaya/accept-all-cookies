# 010 · Nivel 6 — Cross-Site Tracking

**Estado:** aprobado

## Qué hace

Implementa el Nivel 6 (GDD §9, Nivel 6): un **tablero de flechas de 40×7** por el que el jugador guía una **llave** hasta un **candado**. La llave solo se controla sobre casillas vacías; al pisar una flecha, sigue automáticamente la cadena hasta la siguiente casilla vacía o el candado. Alcanzar el candado **habilita el botón Agree**.

El tablero NO se diseña en esta feature: se usa el **layout verificado** de `spec/assets/nivel6-tablero.json` (solución única `→ ↓ → ↓ ↑ →`, imposible quedarse bloqueado, invariantes garantizadas por `spec/tools/validate-level6.mjs` — ver `spec/assets/nivel6-tablero.md` para el grafo de decisiones completo).

### Layout (patrón as-built)

- Texto de consentimiento de Cross-Site Tracking **dentro del marco azul**, ajustado a su contenido.
- El **tablero** se publica vía `useLevelBoard` debajo del marco, sin marco propio.
- El tablero es más ancho que la ventana: se ve a través de una **ventana de cámara** con la **cámara siguiendo a la llave** (desplazamiento horizontal suave, centrando la llave, limitado a los bordes del tablero; las 7 filas + el anillo decorativo caben en vertical sin cámara vertical).
- **Panel de 4 botones de dirección** (↑ ↓ ← →, estilo neutro): a la **derecha del tablero** en tablet/escritorio, **debajo del tablero** en móvil (GDD §15.2). También responden las **flechas del teclado** en escritorio.
- **Pie de ventana** vía `useLevelFooter` (este nivel sí tiene pie): **Agree** (deshabilitado hasta abrir el candado) y **Disagree**.
- El tablero jugable está rodeado por el **anillo de casillas grises decorativas 1×1** del GDD.

### Movimiento

- Con la llave sobre una casilla **vacía** y sin cadena en curso, pulsar una dirección la mueve una casilla:
  - A casilla vacía → se detiene, el jugador recupera el control.
  - A una **flecha** → pierde el control: sigue la cadena flecha a flecha, **animada a velocidad constante** (parámetro, ~10 casillas/s — el castigo de 67 casillas dura ~7 s y es parte del chiste), hasta casilla vacía o candado. Durante la cadena, el input de dirección se ignora.
  - Los **rebotes** (flecha adyacente que apunta de vuelta) también se animan: la llave entra y vuelve — feedback visible de "por ahí no".
  - Un movimiento hacia fuera del tablero **no hace nada** (el anillo decorativo actúa de muro).
- La simulación de cadenas es **lógica pura** con la misma semántica que el validador, y sus tests se contrastan contra el **grafo de decisiones documentado** (destino y longitud de cada dirección desde cada punto de decisión).

### El candado y la victoria

- Al llegar la llave al candado: el candado se muestra abierto, suena el **sonido positivo** una vez (adición pequeña, vetable) y el **Agree del pie se habilita**.
- **Victoria**: pulsar el Agree habilitado → flujo estándar con "Cross-Site Tracking".
- **Derrota**: pulsar Disagree en cualquier momento (`failed`), contador a 0, o X.

### Datos e invariantes

- El JSON del tablero se copia a `src/data/nivel6-tablero.json`. Dos blindajes automatizados:
  - Un test verifica que la copia de `src/data/` es **idéntica** a la de `spec/assets/` (sin deriva entre fuente de verdad y copia).
  - Un test ejecuta el **validador** (`node spec/tools/validate-level6.mjs`) contra la copia de `src/data/` y exige salida 0 — la invariante "no se modifica sin pasar el validador" deja de depender de la disciplina humana.

### Sprites

- Llave, candado (cerrado/abierto) y flechas: **placeholders pixel** hasta que Sofía aporte o apruebe sprites (✋ checkpoint). Las flechas pueden quedarse como glifos estilizados si a Sofía le convencen.

### Pausa y recarga

- `paused` congela la animación de cadenas, la cámara y el input.
- Recargar a mitad: contador restaurado; **la llave vuelve a la casilla de inicio** (posición efímera, como el estado físico de 007–009). Con desenlace pendiente, la modal.

## Por qué

Es el nivel-puzle del juego y el único con contenido diseñado a mano y verificado formalmente — la feature demuestra el flujo dato-verificado → juego: si el tablero cambia algún día, el validador y los tests lo protegen. Mecánicamente es determinista puro (cero azar, cero física): todo testeable sin navegador.

## Criterios de aceptación

### Movimiento y tablero
- [ ] El tablero renderiza el JSON verificado (40×7 + anillo decorativo) y la simulación pura reproduce **exactamente** el grafo de decisiones documentado: desde cada punto de decisión, cada dirección termina donde dice la tabla, con su número de casillas (test parametrizado contra la tabla completa).
- [ ] La secuencia `→ ↓ → ↓ ↑ →` desde el inicio lleva la llave al candado (test + verificado jugando).
- [ ] Durante una cadena el input se ignora; los rebotes se ven (entrar y volver); moverse hacia fuera del tablero no hace nada.
- [ ] La cámara sigue a la llave centrándola, con desplazamiento suave y limitada a los bordes; en los castigos largos se ve a la llave recorrer el tablero de vuelta (el paseo de 67 casillas es visible y dura lo configurado).

### Candado, victoria y derrota
- [ ] Llegar al candado lo abre, suena el positivo una vez y habilita el Agree; el Agree deshabilitado no responde antes.
- [ ] Agree habilitado → victoria con el flujo estándar y la categoría correcta; Disagree en cualquier momento, contador a 0 y X → derrota estándar.

### Datos
- [ ] Test de identidad entre `spec/assets/nivel6-tablero.json` y `src/data/nivel6-tablero.json`.
- [ ] Test que ejecuta el validador contra la copia de `src/data/` y exige éxito.

### Integración y calidad
- [ ] Hueco 6 sustituido con chunk propio (sin matter.js); `levels.6.*` en ambos diccionarios; pie con nodo memoizado (dependencia: candado abierto).
- [ ] Panel de direcciones a la derecha en md+, debajo en xs/sm, botones ≥ 44 px; flechas de teclado funcionan en escritorio.
- [ ] `paused` congela cadena, cámara e input; recarga a mitad (llave al inicio, contador restaurado) y con desenlace pendiente (modal).
- [ ] Cleanup del animador de cadenas al desmontar (test de no-fugas).
- [ ] Partida entera ganando y perdiendo; dedo y ratón; 5 anchos (en 375 px se ven suficientes columnas para orientarse y el panel queda debajo).
- [ ] ✋ Sprites/glifos de llave, candado y flechas aprobados por Sofía.

## Fuera de alcance

- Editar o rediseñar el tablero → cualquier cambio pasa por `spec/assets/` + validador, fuera de esta feature.
- Pistas visuales de la solución (resaltar rutas) → el tablero ya incluye decoys a propósito; nada de ayudas.
- Niveles 7–12 → features 011–016.
