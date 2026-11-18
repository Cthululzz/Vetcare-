import type { SucursalId, UserRole } from "../constants/appConstants";
import type { BranchScoped } from "./organization";

// ============================================
// USUARIOS Y ALCANCE
// ============================================
// Un usuario pertenece a una organización y trabaja en una sucursal. Los
// permisos no se guardan por usuario: se derivan del rol desde la matriz de
// `utils/permissions.ts`.

export interface User extends BranchScoped {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Sedes "centro", "norte" y "sur" definidas en las constantes globales. */
  sucursalId: SucursalId;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

/** Versión persistida: incluye la contraseña provisional de esta etapa. */
export interface StoredUser extends User {
  password: string;
}
