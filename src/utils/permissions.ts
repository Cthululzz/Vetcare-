import type { UserRole } from "../constants/appConstants";

// ============================================
// DEFINICIÓN DE PERMISOS
// ============================================

/**
 * Lista centralizada de todos los permisos del sistema.
 * Agregar nuevos permisos aquí y en la matriz PERMISSION_MATRIX.
 */
export const PERMISSIONS = {
  // Pacientes
  PATIENTS_VIEW: "patients.view",
  PATIENTS_CREATE: "patients.create",
  PATIENTS_EDIT: "patients.edit",
  PATIENTS_DELETE: "patients.delete",

  // Citas
  APPOINTMENTS_VIEW: "appointments.view",
  APPOINTMENTS_CREATE: "appointments.create",
  APPOINTMENTS_EDIT: "appointments.edit",
  APPOINTMENTS_DELETE: "appointments.delete",

  // Historial clínico
  CLINICAL_HISTORY_VIEW: "clinical.view",
  CLINICAL_HISTORY_EDIT: "clinical.edit",

  // Inventario
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",

  // Reportes
  REPORTS_VIEW: "reports.view",

  // Sistema
  SYSTEM_ADMIN: "system.admin",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// MATRIZ DE PERMISOS POR ROL
// ============================================

/**
 * Define qué permisos tiene cada rol.
 * Fácil de leer, modificar y auditar.
 */
const PERMISSION_MATRIX: Record<UserRole, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS), // Admin tiene todos los permisos

  VET: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
    PERMISSIONS.CLINICAL_HISTORY_EDIT,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],

  RECEPTIONIST: [
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.PATIENTS_CREATE,
    PERMISSIONS.PATIENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_CREATE,
    PERMISSIONS.APPOINTMENTS_EDIT,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.CLINICAL_HISTORY_VIEW,
  ],

  INVENTORY: [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE],
};

// ============================================
// API PÚBLICA
// ============================================

/**
 * Verifica si un rol tiene un permiso específico
 */
export const hasPermission = (
  role: UserRole,
  permission: Permission,
): boolean => {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
};

/**
 * Verifica si al menos uno de los roles tiene el permiso
 * Útil cuando un usuario puede tener múltiples roles
 */
export const anyRoleHasPermission = (
  roles: UserRole[],
  permission: Permission,
): boolean => {
  return roles.some((role) => hasPermission(role, permission));
};

/**
 * Verifica si todos los permisos están concedidos para los roles dados
 */
export const hasAllPermissions = (
  roles: UserRole[],
  permissions: Permission[],
): boolean => {
  return permissions.every((permission) =>
    anyRoleHasPermission(roles, permission),
  );
};

/**
 * Obtiene todos los permisos combinados de una lista de roles
 */
export const getPermissionsForRoles = (roles: UserRole[]): Permission[] => {
  const permissionSet = new Set<Permission>();
  roles.forEach((role) => {
    PERMISSION_MATRIX[role]?.forEach((permission) => {
      permissionSet.add(permission);
    });
  });
  return Array.from(permissionSet);
};

// ============================================
// HELPERS DE CONVENIENCIA (compatibles con API vieja)
// ============================================

/**
 * Objeto de verificación rápida (reemplazo del viejo `can`)
 * Uso: `can.accessClinicalFlow(userRoles)`
 */
export const can = {
  accessClinicalFlow: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.CLINICAL_HISTORY_EDIT),

  accessInventory: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.INVENTORY_MANAGE),

  accessReception: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.APPOINTMENTS_CREATE),

  // Nuevos helpers
  managePatients: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.PATIENTS_EDIT),

  deletePatients: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.PATIENTS_DELETE),

  manageAppointments: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.APPOINTMENTS_EDIT),

  viewReports: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.REPORTS_VIEW),

  adminAccess: (roles: UserRole[]) =>
    anyRoleHasPermission(roles, PERMISSIONS.SYSTEM_ADMIN),
};
