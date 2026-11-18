import type { BranchScoped } from "../types/organization";

// ============================================
// IDENTIDAD DE UNA CAMA
// ============================================
// El nombre de una cama se repite entre sucursales. La identidad real es la
// organización + la sucursal + el nombre; usar solo el nombre mezclaba camas
// de sedes distintas al calcular ocupación o al resolver duplicados.

/** Clave estable para comparar una cama en cualquier hook o componente. */
export function bedKey(scope: BranchScoped, bed: string): string {
  return `${scope.organizationId}|${scope.sucursalId}|${bed.trim()}`;
}
