# Roadmap de VetCare+

> Actualizado: 18 nov 2026. Este archivo refleja el estado real del frontend
> (localStorage) y la planificación pendiente. No implica que la migración a
> backend esté implementada.

## Fase 1: Core & Frontend (MVP actual)

- [x] Pantalla de Login moderna con Tailwind.
- [x] Dashboard ejecutivo limpio (StatsCards + resumen de agenda).
- [x] Módulo de Agenda / Citas (persistencia local, filtro por sucursal).
- [x] Módulo de Pacientes y Ficha Clínica (historial, recetas, órdenes de exámenes).
- [x] Módulo de Inventario (Kardex básico + recordatorios de stock).
- [x] Consulta completa: signos vitales, diagnóstico, hospitalización, receta y orden de exámenes.
- [x] Licenciamiento, activación y recuperación de acceso (simulados en cliente).
- [x] Control de roles y alcance por sucursal en la interfaz.
- [x] Cerrar sesión visible en el sidebar; en desarrollo se puede suspender el auto-login y reactivarlo desde un control.
- [x] Permisos de crear/editar/eliminar citas aplicados en la agenda; borrado con confirmación.
- [x] Página "Mi cuenta": edición de perfil y cambio de contraseña.
- [x] Menú lateral plegable en móvil (botón de hamburguesa).
- [x] Respaldos JSON: exportación e importación validadas desde Configuración (respeta el modo lectura de licencia).
- [x] Impresión de receta, orden de exámenes y registro clínico sin dependencias nuevas.
- [x] Módulo de reportes: citas por estado/tipo, pacientes por especie y stock crítico, con filtro de fechas.
- [x] Módulo de Recetas: listado, búsqueda, detalle, impresión y eliminación con confirmación.
- [ ] Seguridad real de contraseñas (hoy se guardan en claro en localStorage; se resuelve con el backend).
- [x] Optimización: dividir el bundle JS (~245 kB inicial) y reducir el logo (~38 kB).

## Fase 2: Arquitectura & Multi-sucursal (planificada, no implementada)

- [ ] Diseño de la base de datos relacional (MySQL/PostgreSQL) con `sucursal_id` / `organization_id`.
- [ ] Separación de vistas según la sucursal activa (ya existe en frontend; falta en datos reales).
- [x] Unificar los identificadores de organización: `vet-piloto` es el ID canónico y `vet-demo` se migra automáticamente al leer localStorage.
- [ ] Definir esquema de tablas para: usuarios, citas, pacientes, propietarios, historial, recetas, órdenes de exámenes, hospitalización e inventario.

## Fase 3: Conexión & Backend (pendiente)

- [ ] Migrar de localStorage a Supabase Pro (un solo proyecto para todas las organizaciones).
- [ ] Autenticación real de usuarios por roles (reemplazar `useAuth` simulado).
- [ ] Row Level Security (RLS) por organización y sucursal.
- [ ] Integración de notificaciones (WhatsApp / correo) para recordatorios y alertas.
- [ ] Pagos/respaldos con Supabase Pro; despliegue en Cloudflare Pages plan gratis.
- [ ] Prueba y versión oficial compartiendo la misma base de datos con datos separados por organización.
- [ ] Firma de licencias `VETEXT` / `VETPAGO` en servidor (hoy solo en cliente).

## Postergado

- [ ] Tauri + SQLite con cola `outbox` para operación offline (requiere backend real primero).
