# 012 · Nivel 8 — Third-Party Providers (trilero) — Tareas

- [ ] Al pulsar un Disagree en la fase reveal, es derrota, anotarlo en el GDD.
- [ ] Implementar `shuffle.ts` (guion determinista: posición inicial + 3 rondas de intercambios + celda final del Agree) + tests (biyección, trazabilidad del Agree, reproducibilidad por semilla, dispersión de posiciones iniciales).
- [ ] Implementar `phases.ts` (máquina `reveal → flip → shuffling → choosing → done`, qué input acepta cada fase) + tests.
- [ ] Implementar el reloj de fases sobre rAF con acumulador (congelable por `paused`, cancelable en cleanup) + test con tiempo simulado.
- [ ] Implementar `Level08.tsx`: texto en el marco; cuadrícula vía `useLevelBoard` con 12 botones de identidad estable posicionados por custom property; flip de los 12 a la vez; input ignorado salvo en `reveal` y `choosing`; `coin.mp3` una vez en el flip.
- [ ] Estilos `Level08.module.scss`: rejilla 4×3 (md+) / 3×4 (xs/sm), botones ≥ 44 px, flip 3D con cambio de cara a mitad, `z-index` temporal en el par que se cruza.
- [ ] Garantizar indistinguibilidad tras el flip + test (los 12 nodos idénticos salvo posición; nada en el DOM delata al Agree).
- [ ] `paused` congela flip y barajado sin saltos al reanudar; cleanup total al desmontar + test de no-fugas.
- [ ] Sustituir el hueco 8 del registro; verificar chunk propio sin matter.js.
- [ ] Añadir `levels.8.*` a ambos diccionarios.
- [ ] GDD §14: duración del flip, duraciones e intercambios por ronda.
- [ ] ✋ **Checkpoint con Sofía**: legibilidad del barajado (¿se puede seguir el botón?, ¿se notan las tres velocidades?), necesidad de arco en los recorridos y visto bueno al sonido del flip.
- [ ] QA: ganar eligiendo el correcto y perder eligiendo otro; pulsar durante flip y barajado (sin efecto); contador a 0 y X en plena fase de barajado; `paused` a mitad de ronda; recarga a mitad (reveal nuevo); 5 anchos; móvil real vía Pages.
- [ ] Validar contra los criterios de aceptación de `spec.md`.
- [ ] Mover la feature a "Hecho" en `../../constitution/roadmap.md`.
