import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import {
  GRACE_DAYS,
  LICENSE_BLOCK_DAYS,
  PILOT_ACTIVATION_CODE,
  PILOT_ORGANIZATION_ID,
  PROVIDER_CLINICS_KEY,
  TRIAL_DAYS,
  type LicensePayment,
  type ProviderClinic,
} from "../constants/license";
import { getLocalTodayStr } from "../utils/dateUtils";
import { buildProviderUpdateCode } from "../utils/licenseUpdateCodes";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const diasDesde = (fecha: string, hoy: string): number => {
  const inicio = new Date(`${fecha}T00:00:00`).getTime();
  const actual = new Date(`${hoy}T00:00:00`).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.floor((actual - inicio) / MS_POR_DIA);
};

const sumarMeses = (fecha: string, meses: number): string => {
  const base = new Date(`${fecha}T00:00:00`);
  base.setMonth(base.getMonth() + meses);
  return getLocalTodayStr(base);
};

export type ClinicPaymentState =
  | "al_dia"
  | "prueba"
  | "gracia"
  | "bloqueado";

export interface ClinicView extends ProviderClinic {
  diasRestantes: number;
  diasGraciaRestantes: number;
  diasDeGracia: number;
  estadoPago: ClinicPaymentState;
}

export interface NewProviderClinic {
  name: string;
  organizationId: string;
  adminName: string;
  adminEmail: string;
  activationCode: string;
  trialStart: string;
}

export interface ExtensionResult {
  code: string;
  paidUntil: string;
  months: number;
}

/** Describe el estado de pago de una veterinaria base en una fecha dada. */
export const describeClinic = (
  clinic: ProviderClinic,
  hoy: string = getLocalTodayStr(),
): ClinicView => {
  const transcurridos = diasDesde(clinic.trialStart, hoy);
  const diasRestantes = Math.max(0, TRIAL_DAYS - transcurridos);
  const diasGraciaRestantes = Math.max(
    0,
    LICENSE_BLOCK_DAYS - transcurridos,
  );
  const alDia = Boolean(clinic.paidUntil && clinic.paidUntil >= hoy);
  const estadoPago: ClinicPaymentState = alDia
    ? "al_dia"
    : transcurridos < TRIAL_DAYS
      ? "prueba"
      : transcurridos < LICENSE_BLOCK_DAYS
        ? "gracia"
        : "bloqueado";

  return {
    ...clinic,
    diasRestantes,
    diasGraciaRestantes,
    diasDeGracia: GRACE_DAYS,
    estadoPago,
  };
};

/**
 * Registro privado del proveedor. Vive en este equipo y no contiene sucursales:
 * una entrada por veterinaria base con su administrador y su licencia.
 */
export function useProviderClinics() {
  const [clinics, setClinics] = useLocalStorage<ProviderClinic[]>(
    PROVIDER_CLINICS_KEY,
    [],
  );

  const registerClinic = useCallback(
    (data: NewProviderClinic): ProviderClinic | null => {
      const organizationId = data.organizationId.trim() || PILOT_ORGANIZATION_ID;
      if (clinics.some((item) => item.organizationId === organizationId)) {
        return null;
      }

      const ahora = new Date().toISOString();
      const clinic: ProviderClinic = {
        organizationId,
        name: data.name.trim() || "Veterinaria base",
        adminName: data.adminName.trim(),
        adminEmail: data.adminEmail.trim().toLowerCase(),
        activationCode:
          data.activationCode.trim() || PILOT_ACTIVATION_CODE,
        trialStart: data.trialStart || getLocalTodayStr(),
        paidUntil: null,
        status: "trial",
        payments: [],
        createdAt: ahora,
        updatedAt: ahora,
      };
      setClinics((prev) => [...prev, clinic]);
      return clinic;
    },
    [clinics, setClinics],
  );

  const updateTrialStart = useCallback(
    (organizationId: string, trialStart: string): void => {
      setClinics((prev) =>
        prev.map((clinic) =>
          clinic.organizationId === organizationId
            ? { ...clinic, trialStart, updatedAt: new Date().toISOString() }
            : clinic,
        ),
      );
    },
    [setClinics],
  );

  const updateAdmin = useCallback(
    (organizationId: string, adminName: string, adminEmail: string): void => {
      setClinics((prev) =>
        prev.map((clinic) =>
          clinic.organizationId === organizationId
            ? {
                ...clinic,
                adminName: adminName.trim(),
                adminEmail: adminEmail.trim().toLowerCase(),
                updatedAt: new Date().toISOString(),
              }
            : clinic,
        ),
      );
    },
    [setClinics],
  );

  /**
   * Registra la extensión en el registro del proveedor y devuelve el código
   * que debe recibir la clínica. No modifica el localStorage de otro equipo.
   */
  const extendClinic = useCallback(
    (organizationId: string, meses: number): ExtensionResult | null => {
      const clinic = clinics.find(
        (item) => item.organizationId === organizationId,
      );
      if (!clinic || meses <= 0) return null;

      const hoy = getLocalTodayStr();
      const base =
        clinic.paidUntil && clinic.paidUntil >= hoy
          ? clinic.paidUntil
          : hoy;
      const paidUntil = sumarMeses(base, meses);
      const code = buildProviderUpdateCode(organizationId, paidUntil, meses);
      const payment: LicensePayment = {
        date: hoy,
        months: meses,
        code,
        origin: "proveedor",
      };

      setClinics((prev) =>
        prev.map((item) =>
          item.organizationId === organizationId
            ? {
                ...item,
                paidUntil,
                status: "active",
                payments: [...item.payments, payment],
                lastUpdateCode: code,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      return { code, paidUntil, months: meses };
    },
    [clinics, setClinics],
  );

  const removeClinic = useCallback(
    (organizationId: string): void => {
      setClinics((prev) =>
        prev.filter((clinic) => clinic.organizationId !== organizationId),
      );
    },
    [setClinics],
  );

  return {
    clinics,
    registerClinic,
    updateTrialStart,
    updateAdmin,
    extendClinic,
    removeClinic,
  };
}
