// ============================================
// MIGRACIÓN DEL ALMACENAMIENTO LOCAL
// ============================================
// Los datos creados antes del contrato multi-sucursal no tienen
// `organizationId` ni `sucursalId`. Esta normalización se aplica cada vez que
// se lee una key desde localStorage, de modo que ningún hook reciba datos
// incompletos. El valor migrado se guarda de vuelta una sola vez.

import {
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_SUCURSAL_ID,
  isValidSucursalId,
} from "../constants/appConstants";
import type { SucursalId } from "../constants/appConstants";
import type { BranchScoped } from "../types/organization";

export const STORAGE_SCHEMA_VERSION = 2;
export const SCHEMA_VERSION_KEY = "vet_schema_version";

/** Keys cuyos elementos son entidades con alcance de sucursal. */
const BRANCH_SCOPED_KEYS = new Set([
  "vet_owners",
  "vet_patients",
  "vet_appointments",
  "vet_hospitalizations",
  "vet_hospital_beds",
  "vet_inventory",
  "vet_inventory_movements",
  "vet_inventory_tags",
  "vet_inventory_reminders",
  "vet_appointment_reminders",
  "vet_prescriptions",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Completa los campos de alcance. El valor explícito gana; si falta o no es
 * válido se usa el del padre (para registros anidados) o el valor por defecto.
 */
const withScope = <T extends Record<string, unknown>>(
  value: T,
  fallback?: BranchScoped,
): T & BranchScoped => {
  const raw = value as Partial<BranchScoped>;
  const organizationId =
    typeof raw.organizationId === "string" && raw.organizationId.trim()
      ? raw.organizationId
      : (fallback?.organizationId ?? DEFAULT_ORGANIZATION_ID);
  const sucursalId = isValidSucursalId(raw.sucursalId)
    ? raw.sucursalId
    : (fallback?.sucursalId ?? DEFAULT_SUCURSAL_ID);

  return { ...value, organizationId, sucursalId };
};

const normalizePatients = (value: unknown[]): unknown[] =>
  value.map((item) => {
    if (!isRecord(item)) return item;

    const patient = withScope(item);
    const history = Array.isArray(item.history)
      ? item.history.map((record) =>
          isRecord(record) ? withScope(record, patient) : record,
        )
      : item.history;

    return { ...patient, history };
  });

const PREFIJO_SUCURSAL_CAMA: Record<string, SucursalId> = {
  C: "centro",
  N: "norte",
  S: "sur",
};

/** Las camas antiguas llevaban el prefijo de sucursal en el nombre. */
const inferSucursalDeCama = (name: string): SucursalId => {
  const match = /^Cama\s+([CNS])-/i.exec(name);
  if (!match) return DEFAULT_SUCURSAL_ID;
  return PREFIJO_SUCURSAL_CAMA[match[1].toUpperCase()] ?? DEFAULT_SUCURSAL_ID;
};

/**
 * `vet_hospital_beds` pasó de `string[]` a entidades con alcance. El mismo
 * nombre puede existir en dos sucursales, así que el duplicado se decide por
 * organización + sucursal + nombre, no solo por nombre.
 */
const normalizeHospitalBeds = (value: unknown[]): unknown[] => {
  const seen = new Set<string>();
  const normalized: unknown[] = [];

  for (const item of value) {
    let bed: ({ name: string } & BranchScoped) | undefined;

    if (typeof item === "string" && item.trim()) {
      const name = item.trim();
      bed = {
        ...withScope(
          {},
          {
            organizationId: DEFAULT_ORGANIZATION_ID,
            sucursalId: inferSucursalDeCama(name),
          },
        ),
        name,
      };
    } else if (
      isRecord(item) &&
      typeof item.name === "string" &&
      item.name.trim()
    ) {
      const name = item.name.trim();
      bed = withScope(
        { ...item, name },
        {
          organizationId: DEFAULT_ORGANIZATION_ID,
          sucursalId: inferSucursalDeCama(name),
        },
      ) as { name: string } & BranchScoped;
    }

    if (!bed) {
      normalized.push(item);
      continue;
    }

    const key = `${bed.organizationId}|${bed.sucursalId}|${bed.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(bed);
  }

  return normalized;
};

export interface NormalizedStorageValue<T> {
  value: T;
  changed: boolean;
}

/**
 * Aplica la migración correspondiente a una key. Devuelve la misma referencia
 * cuando no hay cambios, para respetar el contrato de `useSyncExternalStore`.
 */
export function normalizeStoredValue<T>(
  key: string,
  stored: T,
): NormalizedStorageValue<T> {
  if (!BRANCH_SCOPED_KEYS.has(key) || !Array.isArray(stored)) {
    return { value: stored, changed: false };
  }

  const items = stored as unknown[];
  const normalized =
    key === "vet_patients"
      ? normalizePatients(items)
      : key === "vet_hospital_beds"
        ? normalizeHospitalBeds(items)
        : items.map((item) => (isRecord(item) ? withScope(item) : item));

  if (JSON.stringify(items) === JSON.stringify(normalized)) {
    return { value: stored, changed: false };
  }

  return { value: normalized as T, changed: true };
}

/**
 * Migra todas las keys conocidas al iniciar. La normalización perezosa de
 * `readFromStorage` sigue existiendo como red de seguridad, pero hay keys
 * (por ejemplo las recetas) que no se leen hasta que se abre un modal.
 */
export function migrateAllStoredValues(): void {
  if (typeof window === "undefined") return;

  for (const key of BRANCH_SCOPED_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const { value, changed } = normalizeStoredValue(key, parsed);
      if (changed) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Una key corrupta la deja el lector original, que ya registra el error.
    }
  }
}

/** Registra la versión de esquema para migraciones futuras. */
export function ensureSchemaVersion(): void {
  if (typeof window === "undefined") return;

  const current = window.localStorage.getItem(SCHEMA_VERSION_KEY);
  if (current === String(STORAGE_SCHEMA_VERSION)) return;

  window.localStorage.setItem(
    SCHEMA_VERSION_KEY,
    String(STORAGE_SCHEMA_VERSION),
  );
}

/** Helper de alcance por defecto para entidades creadas desde los hooks. */
export const defaultBranchScope = (): BranchScoped => ({
  organizationId: DEFAULT_ORGANIZATION_ID,
  sucursalId: DEFAULT_SUCURSAL_ID,
});
