import { createContext, useCallback, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_SUCURSAL_ID,
  isValidSucursalId,
} from "../constants/appConstants";
import type { SucursalId } from "../constants/appConstants";
import type { BranchScoped } from "../types/organization";

// ============================================
// SUCURSAL ACTIVA
// ============================================
// La sucursal elegida se persiste y define qué datos ve el usuario. "all" solo
// está disponible para ADMIN. Los hooks de dominio consumen este contexto para
// filtrar lecturas y para asignar la sucursal de las entidades nuevas.

export type ActiveBranch = SucursalId | "all";

const BRANCH_KEY = "vet_active_branch";
const ADMIN_DEFAULT_BRANCH: ActiveBranch = "all";

export interface BranchContextValue {
  /** Valor efectivo después de aplicar el permiso del rol. */
  activeBranch: ActiveBranch;
  /** Sucursal asignada al usuario, usada como destino de las escrituras. */
  userSucursalId: SucursalId;
  canViewAll: boolean;
  setActiveBranch: (branch: string) => void;
  filterByScope: <T extends BranchScoped>(items: T[]) => T[];
  matchesScope: (item: BranchScoped) => boolean;
  /**
   * Alcance de una escritura. Si se indica una sucursal, solo se respeta para
   * ADMIN mientras ve "Todas"; los demás roles quedan en la sucursal asignada.
   */
  writeScope: (sucursalId?: unknown) => BranchScoped;
}

export const BranchContext = createContext<BranchContextValue | null>(null);

export const parseBranch = (
  value: unknown,
  fallback: ActiveBranch,
): ActiveBranch => {
  if (value === "all") return "all";
  return isValidSucursalId(value) ? value : fallback;
};

export function useBranchScope(): BranchContextValue {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranchScope debe usarse dentro de BranchProvider");
  }
  return context;
}

/** Estado de la sucursal activa, compartido por el provider. */
export function useActiveBranchState(user: {
  role?: string;
  sucursalId?: unknown;
}): BranchContextValue {
  const [storedBranch, setStoredBranch] = useLocalStorage<ActiveBranch>(
    BRANCH_KEY,
    ADMIN_DEFAULT_BRANCH,
  );

  const userSucursalId: SucursalId = isValidSucursalId(user.sucursalId)
    ? user.sucursalId
    : DEFAULT_SUCURSAL_ID;
  const canViewAll = user.role === "ADMIN";

  const selectedBranch = parseBranch(
    storedBranch,
    canViewAll ? ADMIN_DEFAULT_BRANCH : userSucursalId,
  );
  const activeBranch: ActiveBranch = canViewAll
    ? selectedBranch
    : userSucursalId;

  const setActiveBranch = useCallback(
    (branch: string) => {
      const parsed = parseBranch(branch, userSucursalId);
      const nextBranch: ActiveBranch =
        parsed === "all" && !canViewAll ? userSucursalId : parsed;
      setStoredBranch(nextBranch);
    },
    [canViewAll, setStoredBranch, userSucursalId],
  );

  const matchesScope = useCallback(
    (item: BranchScoped): boolean =>
      activeBranch === "all" || item.sucursalId === activeBranch,
    [activeBranch],
  );

  const filterByScope = useCallback(
    function <T extends BranchScoped>(items: T[]): T[] {
      return items.filter(matchesScope);
    },
    [matchesScope],
  );

  const writeScope = useCallback(
    (sucursalId?: unknown): BranchScoped => {
      const destinoPorDefecto =
        activeBranch === "all" ? userSucursalId : activeBranch;
      const sucursalSolicitada = isValidSucursalId(sucursalId)
        ? sucursalId
        : undefined;
      const destino =
        canViewAll && sucursalSolicitada
          ? sucursalSolicitada
          : destinoPorDefecto;

      return {
        organizationId: DEFAULT_ORGANIZATION_ID,
        sucursalId: destino,
      };
    },
    [activeBranch, canViewAll, userSucursalId],
  );

  return {
    activeBranch,
    userSucursalId,
    canViewAll,
    setActiveBranch,
    filterByScope,
    matchesScope,
    writeScope,
  };
}
