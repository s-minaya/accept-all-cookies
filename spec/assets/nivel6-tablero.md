# Nivel 6 — Cross-Site Tracking: diseño del tablero (v1, verificado)

Tablero de **40 columnas × 7 filas**, diseñado a mano y **verificado por script** (`tools/validate-level6.mjs`). El JSON listo para consumir desde React está en `nivel6-tablero.json`.

## Leyenda

| Símbolo | Significado |
|---|---|
| `.` | Casilla vacía |
| `^` `v` `<` `>` | Flecha (la llave la sigue automáticamente) |
| `K` | Posición inicial de la llave (casilla vacía) |
| `L` | Candado |

## Tablero

```
    0123456789012345678901234567890123456789
  0 .v<<<<<<<>.....>.<.>>>>>>>>>>>>>>>>>>>>v
  1 .v..>>>>.<.....>>>>.<..>>>>>>>.>>v.....v
  2 .v..^>^^v...<..^^..v....^...>vvv.v.....v
  3 >K>>^...vv.<..<^...>>v..^.....v..>>>>>Lv
  4 .^.....vv..>.v.^...^.>>>.v..v.v.>...^^.v
  5 .^>^..^.>>>>>.>^........vv....v..v.....v
  6 .^<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
```

## Cómo funciona el diseño

Solo existen **6 casillas vacías alcanzables** (los puntos de decisión). Todo lo demás son cadenas de flechas:

- **D0** = `K` en (fila 3, col 1) — inicio.
- **D1** = (1, 8) · **D2** = (5, 13) · **D3** = (1, 19) · **D4** = (4, 24) · **D5** = (1, 30).
- **Candado** en (3, 38).

### Solución única

```
D0 → D1 → D2 → D3 → D4 → D5 → CANDADO
Pulsando:  →   ↓    →    ↓    ↑    →
```

### Grafo de decisiones completo (verificado)

Cada dirección desde cada punto de decisión hace exactamente esto (entre paréntesis, casillas de cadena recorridas — sirve para calibrar la duración de las animaciones):

| Decisión | ↑ | ↓ | ← | → |
|---|---|---|---|---|
| **D0** | rebote (1) | rebote (1) | rebote (1) | **→ D1** (8) |
| **D1** | castigo → D0 (10) | **→ D2** (8) | rebote (1) | rebote (1) |
| **D2** | rebote (1) | castigo → D0 (15) | rebote (1) | **→ D3** (9) |
| **D3** | castigo épico → D0 (67) | **→ D4** (7) | rebote (1) | rebote (1) |
| **D4** | **→ D5** (8) | castigo → D0 (27) | rebote (1) | castigo → D0 (29) |
| **D5** | castigo → D0 (56) | castigo → D0 (36) | rebote (1) | **→ CANDADO** (9) |

Tres tipos de resultado:

1. **Rebote** (muro blando): una flecha adyacente apunta de vuelta a la casilla de decisión; la llave entra y vuelve al instante. Feedback barato de "por ahí no".
2. **Avance**: cadena de flechas hasta el siguiente punto de decisión.
3. **Castigo**: cadena larga que desemboca en la **autopista de retorno** (toda la fila 6 apunta a la izquierda, sube por la columna 1) y devuelve la llave a D0. El más cruel es D3-↑: 67 casillas de paseo por la fila 0, la columna 39 y toda la fila 6. El jugador nunca se queda bloqueado: todo error acaba en D0.

### Decoys

26 flechas señuelo repartidas por casillas **inalcanzables** (verificado: no alteran la alcanzabilidad y, si por error de implementación se entrase en ellas, ninguna forma bucles ni sale del tablero). Su única función es ruido visual: que el tablero parezca un laberinto denso y no se distinga a ojo qué flechas importan.

## Invariantes verificadas por el script

- [x] Existe **exactamente un** camino simple de D0 al candado.
- [x] Desde **cualquier** casilla alcanzable siempre se puede llegar al candado (nunca bloqueado).
- [x] Ninguna cadena de flechas forma bucle infinito (incluidos decoys).
- [x] Ninguna cadena sale del tablero.
- [x] Las únicas casillas vacías alcanzables son los 6 puntos de decisión (el jugador no puede "pasear" fuera del puzle).

## Reglas de implementación derivadas

- Moverse hacia fuera del tablero desde una casilla vacía **no hace nada** (el borde decorativo gris actúa como muro).
- Las casillas de decisión están rodeadas por flechas en sus 4 lados: el jugador nunca camina libremente entre casillas vacías; cada pulsación entra en una cadena (aunque sea un rebote).
- La cámara sigue a la llave con scroll horizontal; durante las cadenas automáticas el jugador no tiene control (ver GDD).
- Si se edita el layout a mano, **volver a pasar el validador** antes de dar el tablero por bueno.

## Parámetros ajustables

- Velocidad de la llave en cadenas automáticas (sugerencia inicial: 8–12 casillas/segundo; el castigo de 67 casillas duraría ~6–8 s, que es parte del chiste).
- Número y posición de decoys (regenerables con otra semilla).
