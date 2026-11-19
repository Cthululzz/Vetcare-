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
- [ ] Optimización: dividir el bundle JS (~668 kB) y reducir el logo (2,28 MB).

## Fase 2: Arquitectura & Multi-sucursal (planificada, no implementada)

- [ ] Diseño de la base de datos relacional (MySQL/PostgreSQL) con `sucursal_id` / `organization_id`.
- [ ] Separación de vistas según la sucursal activa (ya existe en frontend; falta en datos reales).
- [ ] Unificar los identificadores de organización (`vet-piloto` vs `vet-demo`).
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
