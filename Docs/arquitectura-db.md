# Notas de Arquitectura y Base de Datos (MySQL)

## Consideración Multi-Sucursal

Para asegurar que VetCare+ soporte una o múltiples sucursales sin romper el sistema, las tablas principales deben incluir una clave foránea o campo identificador:

- `sucursal_id` (INT, Foreign Key a tabla de Sucursales)

Tablas que requerirán este campo obligatoriamente:

- `usuarios` (para saber en qué sucursal trabaja o qué sucursales administra)
- `citas` (para filtrar la agenda por local)
- `pacientes` (propietarios y mascotas asociados a un centro)
- `inventario` (control de stock independiente por cada clínica/sucursal)
