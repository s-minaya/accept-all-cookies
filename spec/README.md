# spec/ — Accept All Cookies (Spec Driven Development)

> Primero se escribe la spec, luego el plan, luego las tareas, y solo entonces se toca el código.

## Estructura

```
spec/
├── constitution/                  ← reglas estables del proyecto
│   ├── mission.md                 ← qué construimos y para quién
│   ├── tech-stack.md              ← tecnologías, convenciones y límites duros
│   └── roadmap.md                 ← orden de las features (001–017)
├── assets/                        ← fuentes de verdad del diseño
│   ├── accept-all-cookies-gdd.md  ← el GDD completo (diseño del juego)
│   ├── nivel6-tablero.md          ← diseño del tablero del nivel 6
│   └── nivel6-tablero.json        ← tablero listo para consumir desde React
├── tools/
│   └── validate-level6.mjs         ← validador del tablero del nivel 6
└── features/                      ← una carpeta por feature
    └── NNN-nombre-feature/
        ├── NNN-spec.md
        ├── NNN-plan.md
        └── NNN-tasks.md
```

## Flujo para una feature nueva

1. Crear `features/NNN-nombre-feature/` con el siguiente número del roadmap.
2. Escribir `NNN-spec.md`: qué hace + criterios de aceptación medibles (siempre incluyen: jugable con ratón Y con dedo, y correcto en los 5 anchos de referencia).
3. Escribir `NNN-plan.md` respetando `constitution/tech-stack.md`.
4. Desglosar en `NNN-tasks.md` y marcar el progreso.
5. Implementar y validar (`npm run test`, `npm run lint`, `npm run build`).
6. Mover la feature a "Hecho" en `constitution/roadmap.md`.

## Reglas de oro

- **La constitución manda**: si una feature choca con `mission.md` o `tech-stack.md`, se replantea la feature.
- **El GDD es la fuente de verdad del diseño**: cualquier discrepancia entre código y GDD se resuelve a favor del GDD, o se actualiza el GDD explícitamente en el mismo cambio.
- **Las specs describen el estado actual, no su historia.** Una decisión de diseño es definitiva en cuanto se toma: se documenta directamente, sin rastro de versiones anteriores, fechas de cambio ni "esto sustituye a lo de antes". Si una decisión cambia, se reescribe la spec como si siempre hubiera sido así — el historial ya vive en `git log`.
- Para OpenCode: el `AGENTS.md` de la raíz del repo debe apuntar aquí y resumir los límites duros de `tech-stack.md`.
