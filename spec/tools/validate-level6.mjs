#!/usr/bin/env node
/**
 * Validador del tablero del Nivel 6 (Cross-Site Tracking).
 *
 * Uso:   node spec/tools/validate-level6.mjs [ruta/al/tablero.json]
 *        (si no se pasa ruta, usa spec/assets/nivel6-tablero.json)
 *
 * Lee el JSON del tablero y comprueba TODAS las invariantes del diseño.
 * Si editas el tablero a mano, ejecuta esto antes de darlo por bueno:
 * te dirá exactamente qué has roto y dónde.
 *
 * Invariantes que comprueba:
 *   1. Formato: dimensiones correctas, símbolos válidos, una K y una L.
 *   2. Ninguna cadena de flechas sale del tablero.
 *   3. Ninguna cadena de flechas forma un bucle infinito.
 *   4. Las únicas casillas vacías alcanzables son los puntos de decisión.
 *   5. Desde cualquier punto alcanzable siempre se puede llegar al candado
 *      (el jugador NUNCA puede quedarse bloqueado).
 *   6. Existe EXACTAMENTE UNA solución, y coincide con el campo "solution".
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- Carga del tablero ----------
const scriptDir = dirname(fileURLToPath(import.meta.url));
const rutaJson = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(scriptDir, '../assets/nivel6-tablero.json');

const datos = JSON.parse(readFileSync(rutaJson, 'utf8'));
const { rows: FILAS, cols: COLS, grid: filas, solution: solucionDeclarada } = datos;

console.log(`Validando: ${rutaJson}\n`);

// ---------- Constantes ----------
const FLECHAS = { '^': [-1, 0], v: [1, 0], '<': [0, -1], '>': [0, 1] };
const DIRECCIONES = { UP: [-1, 0], DOWN: [1, 0], LEFT: [0, -1], RIGHT: [0, 1] };
const SIMBOLOS_VALIDOS = new Set(['.', '^', 'v', '<', '>', 'K', 'L']);

const errores = [];
const fallo = (msg) => errores.push(msg);
const celda = (f, c) => filas[f][c];
const dentro = (f, c) => f >= 0 && f < FILAS && c >= 0 && c < COLS;
const clave = (f, c) => `${f},${c}`;

// ---------- 1. Formato ----------
if (filas.length !== FILAS) fallo(`El grid tiene ${filas.length} filas, se esperaban ${FILAS}.`);
filas.forEach((fila, f) => {
  if (fila.length !== COLS) fallo(`La fila ${f} tiene ${fila.length} columnas, se esperaban ${COLS}.`);
  for (let c = 0; c < fila.length; c++) {
    if (!SIMBOLOS_VALIDOS.has(fila[c])) fallo(`Símbolo inválido '${fila[c]}' en (${f}, ${c}).`);
  }
});

let posLlave = null;
let posCandado = null;
for (let f = 0; f < FILAS; f++) {
  for (let c = 0; c < COLS; c++) {
    if (celda(f, c) === 'K') {
      if (posLlave) fallo(`Hay más de una llave (K): (${posLlave}) y (${f}, ${c}).`);
      posLlave = [f, c];
    }
    if (celda(f, c) === 'L') {
      if (posCandado) fallo(`Hay más de un candado (L): (${posCandado}) y (${f}, ${c}).`);
      posCandado = [f, c];
    }
  }
}
if (!posLlave) fallo('No hay llave (K) en el tablero.');
if (!posCandado) fallo('No hay candado (L) en el tablero.');
if (errores.length) terminar(); // sin formato correcto no tiene sentido seguir

// ---------- Simulador de movimiento ----------
/**
 * Simula pulsar una dirección estando la llave en `origen`.
 * Devuelve { tipo, destino, pasos }:
 *   tipo 'blocked' → el movimiento saldría del tablero (no se permite)
 *   tipo 'stop'    → la llave acaba parada en una casilla vacía
 *   tipo 'lock'    → la llave llega al candado
 *   tipo 'loop'    → BUCLE INFINITO de flechas (error de diseño)
 *   tipo 'out'     → una cadena de flechas sale del tablero (error de diseño)
 */
function simular(origen, direccion) {
  let [df, dc] = DIRECCIONES[direccion];
  let f = origen[0] + df;
  let c = origen[1] + dc;
  if (!dentro(f, c)) return { tipo: 'blocked', destino: origen, pasos: 0 };

  const vistas = new Set();
  let pasos = 0;
  for (;;) {
    const s = celda(f, c);
    if (s === '.' || s === 'K') return { tipo: 'stop', destino: [f, c], pasos };
    if (s === 'L') return { tipo: 'lock', destino: [f, c], pasos };
    if (vistas.has(clave(f, c))) return { tipo: 'loop', destino: [f, c], pasos };
    vistas.add(clave(f, c));
    [df, dc] = FLECHAS[s];
    f += df;
    c += dc;
    pasos++;
    if (!dentro(f, c)) return { tipo: 'out', destino: [f - df, c - dc], pasos };
  }
}

// ---------- 2 y 3. Toda flecha del tablero termina bien ----------
// (incluye los decoys: si por un bug se entrase en ellos, tampoco pueden romper nada)
for (let f = 0; f < FILAS; f++) {
  for (let c = 0; c < COLS; c++) {
    if (!(celda(f, c) in FLECHAS)) continue;
    let [ff, cc] = [f, c];
    const vistas = new Set();
    while (celda(ff, cc) in FLECHAS) {
      if (vistas.has(clave(ff, cc))) {
        fallo(`Bucle infinito de flechas pasando por (${ff}, ${cc}).`);
        break;
      }
      vistas.add(clave(ff, cc));
      const [df, dc] = FLECHAS[celda(ff, cc)];
      ff += df;
      cc += dc;
      if (!dentro(ff, cc)) {
        fallo(`Una cadena de flechas sale del tablero: la flecha (${ff - df}, ${cc - dc}) apunta fuera.`);
        break;
      }
    }
  }
}

// ---------- 4. Casillas alcanzables ----------
const alcanzables = new Map(); // clave -> [f, c]
alcanzables.set(clave(...posLlave), posLlave);
const frontera = [posLlave];
while (frontera.length) {
  const actual = frontera.pop();
  for (const dir of Object.keys(DIRECCIONES)) {
    const r = simular(actual, dir);
    if (r.tipo === 'loop' || r.tipo === 'out') continue; // ya reportado arriba
    if (r.tipo === 'stop' && !alcanzables.has(clave(...r.destino))) {
      alcanzables.set(clave(...r.destino), r.destino);
      frontera.push(r.destino);
    }
  }
}
const decisiones = [...alcanzables.values()].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
console.log(`Puntos de decisión alcanzables: ${decisiones.length}`);
decisiones.forEach((p, i) => console.log(`  D${i} = (fila ${p[0]}, col ${p[1]})${celda(...p) === 'K' ? '  ← inicio' : ''}`));

// ---------- Grafo de decisiones ----------
const nombre = new Map(decisiones.map((p, i) => [clave(...p), `D${i}`]));
const grafo = new Map(); // nombre -> { direccion: { destino, pasos } }
for (const p of decisiones) {
  const salidas = {};
  for (const dir of Object.keys(DIRECCIONES)) {
    const r = simular(p, dir);
    if (r.tipo === 'lock') salidas[dir] = { destino: 'CANDADO', pasos: r.pasos };
    else if (r.tipo === 'stop') salidas[dir] = { destino: nombre.get(clave(...r.destino)), pasos: r.pasos };
    else salidas[dir] = { destino: '(bloqueado)', pasos: 0 };
  }
  grafo.set(nombre.get(clave(...p)), salidas);
}

console.log('\nGrafo de decisiones (destino, casillas de cadena recorridas):');
for (const [n, salidas] of grafo) {
  const linea = Object.entries(salidas)
    .map(([d, s]) => `${d}→${s.destino}(${s.pasos})`)
    .join('  ');
  console.log(`  ${n}: ${linea}`);
}

// ---------- 5. Nunca bloqueado ----------
function llegaAlCandado(desde) {
  const vistos = new Set([desde]);
  const pila = [desde];
  while (pila.length) {
    const n = pila.pop();
    for (const s of Object.values(grafo.get(n))) {
      if (s.destino === 'CANDADO') return true;
      if (grafo.has(s.destino) && !vistos.has(s.destino)) {
        vistos.add(s.destino);
        pila.push(s.destino);
      }
    }
  }
  return false;
}
for (const n of grafo.keys()) {
  if (!llegaAlCandado(n)) fallo(`BLOQUEO: desde ${n} es imposible llegar al candado.`);
}

// ---------- 6. Solución única ----------
const caminos = [];
(function dfs(nodo, camino, pulsaciones) {
  for (const [dir, s] of Object.entries(grafo.get(nodo))) {
    if (s.destino === 'CANDADO') caminos.push({ camino: [...camino, 'CANDADO'], pulsaciones: [...pulsaciones, dir] });
    else if (grafo.has(s.destino) && !camino.includes(s.destino)) {
      dfs(s.destino, [...camino, s.destino], [...pulsaciones, dir]);
    }
  }
})('D0', ['D0'], []);

console.log(`\nCaminos simples hasta el candado: ${caminos.length}`);
for (const c of caminos) {
  console.log(`  ${c.camino.join(' → ')}   pulsando: ${c.pulsaciones.join(', ')}`);
}
if (caminos.length === 0) fallo('No existe ninguna solución.');
if (caminos.length > 1) fallo(`La solución no es única: hay ${caminos.length} caminos distintos.`);
if (caminos.length === 1 && solucionDeclarada) {
  const real = caminos[0].pulsaciones.join(',');
  const declarada = solucionDeclarada.join(',');
  if (real !== declarada) {
    fallo(`El campo "solution" del JSON (${declarada}) no coincide con la solución real (${real}). Actualízalo.`);
  }
}

terminar();

// ---------- Resultado ----------
function terminar() {
  console.log('');
  if (errores.length) {
    console.error(`❌ TABLERO INVÁLIDO — ${errores.length} problema(s):\n`);
    errores.forEach((e) => console.error(`  • ${e}`));
    process.exit(1);
  }
  console.log('✅ Tablero válido: sin bucles, sin salidas del tablero, imposible quedarse bloqueado y solución única.');
  process.exit(0);
}
