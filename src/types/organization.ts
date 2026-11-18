import type { SucursalId } from "../constants/appConstants";

// ============================================
// MULTI-TENANCY: ORGANIZACIONES Y ALCANCE
// ============================================
// Una organización es una veterinaria. Cada entidad de negocio pertenece a una
// organización y, dentro de ella, a una sucursal. Este archivo define el
// contrato mínimo compartido; la gestión real de organizaciones llegará en la
// siguiente etapa.

export type OrganizationId = string;

export interface Organization {
  id: OrganizationId;
  name: string;
  createdAt: string;
  isActive: boolean;
  /** Fecha ISO hasta la cual la suscripción está al día (plan manual). */
  paidUntil?: string;
}

/** Campos que toda entidad con alcance de sucursal debe persistir. */
export interface BranchScoped {
  organizationId: OrganizationId;
  sucursalId: SucursalId;
}
