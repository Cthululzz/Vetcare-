import {
  LICENSE_KEY,
  PROVIDER_CLINICS_KEY,
  TRIAL_DAYS,
  type License,
} from "../constants/license";
import { getLocalTodayStr } from "./dateUtils";
import { diasDesde, fechaBaseVencimiento } from "./licenseDates";

// Las preferencias de interfaz y la propia licencia se pueden escribir incluso
// en modo lectura; el resto de claves vet_* quedan congeladas.
const ALLOWED_KEYS = new Set([
  LICENSE_KEY,
  PROVIDER_CLINICS_KEY,
  "vet_auth_state",
  "vet_active_branch",
  "vet_seen_tasks",
  "vet_schema_version",
]);

export const READ_ONLY_WRITE_EVENT = "vetcare-readonly-write";

const licenciaBloqueadaParaEscritura = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(LICENSE_KEY);
    if (!raw) return false;
    const license = JSON.parse(raw) as License;
    if (!license?.trialStart) return false;
    if (license.paidUntil && license.paidUntil >= getLocalTodayStr()) {
      return false;
    }
    const referencia = fechaBaseVencimiento(
      license.trialStart,
      license.paidUntil,
      getLocalTodayStr(),
    );
    return diasDesde(referencia, getLocalTodayStr()) >= TRIAL_DAYS;
  } catch {
    return false;
  }
};

let readOnly = licenciaBloqueadaParaEscritura();

export const setLicenseReadOnly = (value: boolean): void => {
  readOnly = value;
};

export const canWriteStorageKey = (key: string): boolean =>
  !readOnly || ALLOWED_KEYS.has(key);

/** Avisa a la interfaz cuando una acción intentó escribir en modo lectura. */
export const notifyReadOnlyWrite = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(READ_ONLY_WRITE_EVENT));
};
