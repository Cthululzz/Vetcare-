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
node scripts/stress-multisucursal-edicion.mjs
node scripts/stress-clientes-compartidos.mjs
```

Cada script imprime un JSON con los datos sembrados, los resultados y los
diagnósticos capturados (excepciones, `console.error`, diálogos nativos).
Todos manejan `Page.javascriptDialogOpening` automáticamente para que un
`window.confirm` olvidado no congele la corrida.

## Qué cubre cada uno

| Script | Objetivo |
| --- | --- |
| `stress-test.mjs` | Volumen alto y barrido de rutas. |
| `stress-fixes.mjs` | Límite del recordatorio de inventario y curación de camas duplicadas dentro de una misma sucursal. |
| `stress-interactions.mjs` | Evolución, dosis con confirmación propia y alta de paciente. |
| `stress-flows2.mjs` | Atomicidad de la finalización de consulta. |
| `stress-final.mjs` | Agenda semana/mes, historial, inventario y tareas. |
| `stress-multisucursal.mjs` | 3 sucursales, camas con alcance por sede (incluida una colisión deliberada), consulta por sucursal, aislamiento del selector (ADMIN/VET) y herencia de alcance en citas, registros, recetas e internaciones. |
| `stress-multisucursal-edicion.mjs` | Edición de nombre, teléfono y correo de propietarios desde cada sucursal y desde “Todas”, verificando que no se dupliquen ni desaparezcan dueños o mascotas. Requiere la semilla de `stress-multisucursal.mjs`. |
| `stress-clientes-compartidos.mjs` | Clientes compartidos: casos A (dueño + mascota iguales), B (dueño igual, mascota distinta) y C (coincidencia dudosa con candidatos); visibilidad por sucursal, confirmación al finalizar, limpieza al eliminar la cita y vínculo manual confirmado desde Pacientes. Siembra sus propios datos con prefijo `CS-`. |

`vetcare-cdp.mjs` es el helper de conexión usado durante el desarrollo.

## Al modificar el contrato de datos

Los scripts siembran objetos directamente en `localStorage`. Si se agrega un
campo obligatorio a una entidad, la migración de
`src/utils/storageMigration.ts` debe completarlo al leer. Después de cualquier
cambio de ese tipo, correr la batería completa y verificar que los diagnósticos
sigan en cero.

Desde el esquema `2`, `vet_hospital_beds` guarda entidades con `organizationId`,
`sucursalId` y `name`. El nombre de una cama puede repetirse entre sedes: la
ocupación y la curación de duplicados se comparan por organización + sucursal +
nombre, nunca solo por nombre.

Regla de herencia verificada por la batería: una entidad derivada debe conservar
`organizationId` y `sucursalId` de su origen. Una cita nueva usa la sucursal
activa (o la elegida por un ADMIN con "Todas"); su dueño y paciente se crean con
el mismo alcance. Los registros médicos y las recetas heredan de la cita, y la
internación, sus registros y sus planes heredan de la internación de origen.
Editar una cita no cambia su sucursal ni la de sus derivadas.
