// Contrato de licencia de la etapa piloto. La clave se entrega en mano junto
// con el instalador, como los códigos que venían al reverso de la caja.

export const LICENSE_KEY = "vet_license";
/** Registro privado del proveedor: una entrada por veterinaria base. */
export const PROVIDER_CLINICS_KEY = "vet_provider_clinics";
export const TRIAL_DAYS = 21;
export const PILOT_ORGANIZATION_ID = "vet-piloto";
export const PILOT_ACTIVATION_CODE = "VET-PILOTO-2026-8F4K";

export type LicenseStatus = "trial" | "active";

export interface LicensePayment {
  date: string;
  months: number;
  /** Código canjeado o actualización entregada por el proveedor. */
  code?: string;
  /** Origen del registro, para distinguir pagos de actualizaciones. */
  origin?: "pago" | "proveedor";
}

export interface License {
  organizationId: string;
  activationCode: string;
  trialStart: string;
  paidUntil: string | null;
  status: LicenseStatus;
  payments: LicensePayment[];
  /** Códigos de pago ya canjeados, guardados sin guiones. */
  usedPaymentCodes: string[];
  /** Actualizaciones del proveedor ya aplicadas en este equipo. */
  usedUpdateCodes: string[];
}

/** Vista del proveedor: solo datos de la veterinaria base y su admin. */
export interface ProviderClinic {
  organizationId: string;
  name: string;
  adminName: string;
  adminEmail: string;
  activationCode: string;
  trialStart: string;
  paidUntil: string | null;
  status: LicenseStatus;
  payments: LicensePayment[];
  createdAt: string;
  updatedAt: string;
  /** Última actualización generada desde la consola, si la hubo. */
  lastUpdateCode?: string;
}

export const normalizeActivationCode = (value: string): string =>
  value.toUpperCase().replace(/[\s-]/g, "");

export const isValidActivationCode = (value: string): boolean =>
  normalizeActivationCode(value) ===
  normalizeActivationCode(PILOT_ACTIVATION_CODE);
