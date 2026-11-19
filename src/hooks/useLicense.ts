import { storageStore, useLocalStorage } from "./useLocalStorage";
import { getLocalTodayStr } from "../utils/dateUtils";
import {
  diasDesde,
  fechaBaseVencimiento,
  sumarMeses,
} from "../utils/licenseDates";
import { isBypassAuthEnabled } from "../utils/authBypass";
import {
  normalizePaymentCode,
  parsePaymentCode,
} from "../utils/paymentCodes";
import {
  normalizeUpdateCode,
  parseProviderUpdateCode,
} from "../utils/licenseUpdateCodes";
import {
  GRACE_DAYS,
  isValidActivationCode,
  LICENSE_BLOCK_DAYS,
  LICENSE_KEY,
  normalizeActivationCode,
  PILOT_ACTIVATION_CODE,
  PILOT_ORGANIZATION_ID,
  PROVIDER_CLINICS_KEY,
  TRIAL_DAYS,
  type License,
  type ProviderClinic,
} from "../constants/license";

const licenciaDeDesarrollo = (): License => ({
  organizationId: PILOT_ORGANIZATION_ID,
  activationCode: PILOT_ACTIVATION_CODE,
  trialStart: getLocalTodayStr(),
  paidUntil: null,
  status: "trial",
  payments: [],
  usedPaymentCodes: [],
  usedUpdateCodes: [],
});

export interface RedeemResult {
  ok: boolean;
  meses?: number;
  error?: string;
}

export const useLicense = () => {
  const bypass = isBypassAuthEnabled();
  const [storedLicense, setLicense] = useLocalStorage<License | null>(
    LICENSE_KEY,
    bypass ? licenciaDeDesarrollo() : null,
  );

  // Licencias creadas antes de los códigos de pago no traen este campo.
  const license: License | null = storedLicense
    ? {
        ...storedLicense,
        usedPaymentCodes: storedLicense.usedPaymentCodes ?? [],
        usedUpdateCodes: storedLicense.usedUpdateCodes ?? [],
      }
    : null;

  const hoy = getLocalTodayStr();
  const diasDePrueba = license ? diasDesde(license.trialStart, hoy) : 0;
  const fechaReferencia = license
    ? fechaBaseVencimiento(license.trialStart, license.paidUntil, hoy)
    : hoy;
  const diasTranscurridos = license ? diasDesde(fechaReferencia, hoy) : 0;
  const diasRestantes = Math.max(0, TRIAL_DAYS - diasDePrueba);
  const diasGraciaRestantes = Math.max(
    0,
    LICENSE_BLOCK_DAYS - diasTranscurridos,
  );
  const suscripcionVigente = Boolean(
    license?.paidUntil && license.paidUntil >= hoy,
  );
  const vencida = Boolean(license && !suscripcionVigente);
  const enGracia = Boolean(
    vencida &&
      diasTranscurridos >= TRIAL_DAYS &&
      diasTranscurridos < LICENSE_BLOCK_DAYS,
  );
  const isBloqueado = Boolean(
    vencida && diasTranscurridos >= LICENSE_BLOCK_DAYS,
  );
  // Durante la gracia y después del bloqueo no se permiten escrituras.
  const isReadOnly = Boolean(
    vencida && diasTranscurridos >= TRIAL_DAYS,
  );

  const activate = (code: string): boolean => {
    const clinicas = storageStore.get<ProviderClinic[]>(
      PROVIDER_CLINICS_KEY,
      [],
    );
    const clinica = clinicas.find(
      (item) =>
        normalizeActivationCode(item.activationCode) ===
        normalizeActivationCode(code),
    );
    if (!isValidActivationCode(code) && !clinica) return false;

    setLicense({
      organizationId: clinica?.organizationId ?? PILOT_ORGANIZATION_ID,
      activationCode: code.trim().toUpperCase(),
      trialStart: clinica?.trialStart || getLocalTodayStr(),
      paidUntil: null,
      status: "trial",
      payments: [],
      usedPaymentCodes: [],
      usedUpdateCodes: [],
    });
    return true;
  };

  const setTrialStart = (fecha: string): void => {
    setLicense((prev) => (prev ? { ...prev, trialStart: fecha } : prev));
  };

  const registerManualPayment = (meses: number): void => {
    if (meses <= 0) return;
    const fechaActual = getLocalTodayStr();
    setLicense((prev) => {
      if (!prev) return prev;
      const base =
        prev.paidUntil && prev.paidUntil >= fechaActual
          ? prev.paidUntil
          : fechaActual;
      return {
        ...prev,
        paidUntil: sumarMeses(base, meses),
        status: "active",
        payments: [
          ...prev.payments,
          { date: fechaActual, months: meses, origin: "pago" },
        ],
        usedPaymentCodes: prev.usedPaymentCodes ?? [],
        usedUpdateCodes: prev.usedUpdateCodes ?? [],
      };
    });
  };

  /** Canjea un código entregado por el proveedor. */
  const redeemPaymentCode = (code: string): RedeemResult => {
    const datos = parsePaymentCode(code);
    if (!datos) {
      return { ok: false, error: "El código de pago no es válido." };
    }
    if (!license) {
      return { ok: false, error: "La licencia no está activada." };
    }

    const normalizado = normalizePaymentCode(code);
    if (license.usedPaymentCodes.includes(normalizado)) {
      return { ok: false, error: "Ese código de pago ya fue utilizado." };
    }

    const fechaActual = getLocalTodayStr();
    setLicense((prev) => {
      if (!prev) return prev;
      const usados = prev.usedPaymentCodes ?? [];
      if (usados.includes(normalizado)) return prev;
      const base =
        prev.paidUntil && prev.paidUntil >= fechaActual
          ? prev.paidUntil
          : fechaActual;
      return {
        ...prev,
        paidUntil: sumarMeses(base, datos.meses),
        status: "active",
        payments: [
          ...prev.payments,
          {
            date: fechaActual,
            months: datos.meses,
            code: normalizado,
            origin: "pago",
          },
        ],
        usedPaymentCodes: [...usados, normalizado],
        usedUpdateCodes: prev.usedUpdateCodes ?? [],
      };
    });

    return { ok: true, meses: datos.meses };
  };

  /** Aplica una actualización generada por el proveedor para esta veterinaria. */
  const applyProviderUpdateCode = (code: string): RedeemResult => {
    const datos = parseProviderUpdateCode(code);
    if (!datos) {
      return { ok: false, error: "El código de actualización no es válido." };
    }
    const fechaActual = getLocalTodayStr();
    if (datos.paidUntil < fechaActual) {
      return {
        ok: false,
        error: "La actualización entregada ya no está vigente. Solicita una nueva.",
      };
    }
    if (!license) {
      return { ok: false, error: "La licencia no está activada." };
    }
    if (datos.organizationId !== license.organizationId) {
      return {
        ok: false,
        error: "Este código corresponde a otra veterinaria base.",
      };
    }

    const normalizado = normalizeUpdateCode(code);
    if (license.usedUpdateCodes.includes(normalizado)) {
      return { ok: false, error: "Ese código de actualización ya fue aplicado." };
    }
    if (license.paidUntil && license.paidUntil >= datos.paidUntil) {
      return { ok: true, meses: 0 };
    }

    const months = datos.months;

    setLicense((prev) => {
      if (!prev) return prev;
      const aplicados = prev.usedUpdateCodes ?? [];
      if (aplicados.includes(normalizado)) return prev;
      return {
        ...prev,
        paidUntil: datos.paidUntil,
        status: "active",
        payments: [
          ...prev.payments,
          {
            date: fechaActual,
            months,
            code: normalizado,
            origin: "proveedor",
          },
        ],
        usedPaymentCodes: prev.usedPaymentCodes ?? [],
        usedUpdateCodes: [...aplicados, normalizado],
      };
    });

    return { ok: true, meses: months };
  };

  /** Acepta tanto actualizaciones del proveedor como códigos de pago. */
  const applyLicenseCode = (code: string): RedeemResult => {
    if (parseProviderUpdateCode(code)) {
      return applyProviderUpdateCode(code);
    }
    return redeemPaymentCode(code);
  };

  return {
    license,
    bypass,
    isActivated: Boolean(license),
    diasRestantes,
    diasGraciaRestantes,
    diasDeGracia: GRACE_DAYS,
    suscripcionVigente,
    enGracia,
    isBloqueado,
    isReadOnly,
    activate,
    setTrialStart,
    registerManualPayment,
    redeemPaymentCode,
    applyProviderUpdateCode,
    applyLicenseCode,
  };
};
