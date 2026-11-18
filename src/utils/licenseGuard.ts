import { LICENSE_KEY } from "../constants/license";

// Las preferencias de interfaz y la propia licencia se pueden escribir incluso
// en modo lectura; el resto de claves vet_* quedan congeladas.
const ALLOWED_KEYS = new Set([
  LICENSE_KEY,
  "vet_auth_state",
  "vet_active_branch",
  "vet_seen_tasks",
  "vet_schema_version",
]);

let readOnly = false;

export const setLicenseReadOnly = (value: boolean): void => {
  readOnly = value;
};

export const canWriteStorageKey = (key: string): boolean =>
  !readOnly || ALLOWED_KEYS.has(key);
