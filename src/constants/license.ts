// Contrato de licencia de la etapa piloto. La clave se entrega en mano junto
// con el instalador, como los códigos que venían al reverso de la caja.

export const LICENSE_KEY = "vet_license";
export const TRIAL_DAYS = 21;
export const PILOT_ORGANIZATION_ID = "vet-piloto";
export const PILOT_ACTIVATION_CODE = "VET-PILOTO-2026-8F4K";

export type LicenseStatus = "trial" | "active";

export interface LicensePayment {
  date: string;
  months: number;
  /** Código canjeado, cuando la extensión no se registró en persona. */
  code?: string;
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
}

export const normalizeActivationCode = (value: string): string =>
  value.toUpperCase().replace(/[\s-]/g, "");

export const isValidActivationCode = (value: string): boolean =>
  normalizeActivationCode(value) ===
  normalizeActivationCode(PILOT_ACTIVATION_CODE);
