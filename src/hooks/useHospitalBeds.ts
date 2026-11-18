import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useBranchScope } from "../context/branchScope";
import { CAMAS_HOSPITALIZACION } from "../constants/hospitalization";
import {
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_SUCURSAL_ID,
} from "../constants/appConstants";
import type { SucursalId } from "../constants/appConstants";
import type { HospitalBed } from "../types/hospitalization";
import { bedKey } from "../utils/bedScope";

// ============================================
// CAMAS FÍSICAS DEL ÁREA DE HOSPITALIZACIÓN
// ============================================
// Una cama pertenece a una sucursal. El nombre puede repetirse en otra sede,
// por eso la entidad completa (organización + sucursal + nombre) es la identidad.
// La ocupación nunca se guarda aquí: se deriva de las internaciones.

const BEDS_KEY = "vet_hospital_beds";

const DEFAULT_BEDS: HospitalBed[] = CAMAS_HOSPITALIZACION.map((name) => ({
  name,
  organizationId: DEFAULT_ORGANIZATION_ID,
  sucursalId: DEFAULT_SUCURSAL_ID,
}));

const buildBedName = (beds: HospitalBed[], sucursalId: SucursalId): string => {
  const used = new Set(
    beds
      .filter((bed) => bed.sucursalId === sucursalId)
      .map((bed) => bed.name),
  );
  let index = used.size + 1;
  let candidate = `Cama ${String(index).padStart(2, "0")}`;

  while (used.has(candidate)) {
    index += 1;
    candidate = `Cama ${String(index).padStart(2, "0")}`;
  }

  return candidate;
};

export function useHospitalBeds() {
  const { filterByScope, writeScope } = useBranchScope();
  const [storedBeds, setStoredBeds] = useLocalStorage<HospitalBed[]>(
    BEDS_KEY,
    DEFAULT_BEDS,
  );

  /** Camas visibles según la sucursal activa (o todas, para ADMIN en "Todas"). */
  const bedEntities = useMemo(
    () => filterByScope(storedBeds),
    [filterByScope, storedBeds],
  );

  /** Nombres únicos del alcance actual, para listados simples. */
  const beds = useMemo(
    () => [...new Set(bedEntities.map((bed) => bed.name))],
    [bedEntities],
  );

  const addBed = useCallback(
    (name?: string): HospitalBed => {
      const scope = writeScope();
      const trimmed = name?.trim();
      const candidate = trimmed || buildBedName(storedBeds, scope.sucursalId);
      const created: HospitalBed = { ...scope, name: candidate };
      const key = bedKey(created, candidate);

      setStoredBeds((prev) =>
        prev.some((bed) => bedKey(bed, bed.name) === key)
          ? prev
          : [...prev, created],
      );

      return created;
    },
    [setStoredBeds, storedBeds, writeScope],
  );

  const removeBed = useCallback(
    (bed: HospitalBed) => {
      const key = bedKey(bed, bed.name);
      setStoredBeds((prev) =>
        prev.filter((item) => bedKey(item, item.name) !== key),
      );
    },
    [setStoredBeds],
  );

  return {
    /** Nombres únicos visibles en el alcance activo. */
    beds,
    /** Entidades visibles en el alcance activo. */
    bedEntities,
    /** Todas las camas persistidas, sin filtrar por sucursal. */
    allBeds: storedBeds,
    addBed,
    removeBed,
  };
}
