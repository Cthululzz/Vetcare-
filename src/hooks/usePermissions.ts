import { useAuth } from "./useAuth";
import type { Permission } from "../utils/permissions";
import { anyRoleHasPermission, PERMISSIONS } from "../utils/permissions";

/**
 * Permisos del usuario actual.
 * Se basa en la matriz central de `utils/permissions.ts`.
 */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role ?? null;

  const can = (permission: Permission): boolean =>
    role ? anyRoleHasPermission([role], permission) : false;

  return {
    role,
    can,
    canAccessClinicalFlow: can(PERMISSIONS.CLINICAL_HISTORY_EDIT),
    canManageInventory: can(PERMISSIONS.INVENTORY_MANAGE),
    canManagePatients: can(PERMISSIONS.PATIENTS_EDIT),
    canDeletePatients: can(PERMISSIONS.PATIENTS_DELETE),
    canManageAppointments: can(PERMISSIONS.APPOINTMENTS_EDIT),
    canViewReports: can(PERMISSIONS.REPORTS_VIEW),
    isAdmin: can(PERMISSIONS.SYSTEM_ADMIN),
  };
}
