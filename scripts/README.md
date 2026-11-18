# Batería de estrés (CDP)

Son scripts de Node que manejan el navegador por Chrome DevTools Protocol. No
son pruebas unitarias y **no** agregan un comando `npm test`: solo escriben
`localStorage` en el navegador de prueba y recorren la app real.

## Prepación

Los scripts esperan el dev server en el puerto `5191` y CDP en el `9344`:

```bash
npm run dev -- --port 5191
```

En otra terminal, abrir Edge/Chrome en modo headless con un perfil propio:

```bash
msedge --headless=new --disable-gpu --no-first-run --disable-sync \
  --remote-debugging-port=9344 \
  --user-data-dir="%TEMP%\vetcare-edge-stress" \
  http://localhost:5191/
```

Después correr, desde la raíz del proyecto:

```bash
node scripts/stress-test.mjs
node scripts/stress-fixes.mjs
node scripts/stress-interactions.mjs
node scripts/stress-flows2.mjs
node scripts/stress-final.mjs
node scripts/stress-multisucursal.mjs
```

Cada script imprime un JSON con los datos sembrados, los resultados y los
diagnósticos capturados (excepciones, `console.error`, diálogos nativos).
Todos manejan `Page.javascriptDialogOpening` automáticamente para que un
`window.confirm` olvidado no congele la corrida.

## Qué cubre cada uno

| Script | Objetivo |
| --- | --- |
| `stress-test.mjs` | Volumen alto y barrido de rutas. |
| `stress-fixes.mjs` | Límite del recordatorio de inventario y curación de camas duplicadas. |
| `stress-interactions.mjs` | Evolución, dosis con confirmación propia y alta de paciente. |
| `stress-flows2.mjs` | Atomicidad de la finalización de consulta. |
| `stress-final.mjs` | Agenda semana/mes, historial, inventario y tareas. |
| `stress-multisucursal.mjs` | 3 sucursales, colisión de camas entre sedes y consulta por sucursal. |

`vetcare-cdp.mjs` es el helper de conexión usado durante el desarrollo.

## Al modificar el contrato de datos

Los scripts siembran objetos directamente en `localStorage`. Si se agrega un
campo obligatorio a una entidad, la migración de
`src/utils/storageMigration.ts` debe completarlo al leer. Después de cualquier
cambio de ese tipo, correr la batería completa y verificar que los diagnósticos
sigan en cero.
