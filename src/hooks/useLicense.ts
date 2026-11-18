import { useLocalStorage } from "./useLocalStorage";
import { getLocalTodayStr } from "../utils/dateUtils";
import {
  normalizePaymentCode,
  parsePaymentCode,
} from "../utils/paymentCodes";
import {
  isValidActivationCode,
  LICENSE_KEY,
  PILOT_ACTIVATION_CODE,
  PILOT_ORGANIZATION_ID,
  TRIAL_DAYS,
  type License,
} from "../constants/license";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const licenciaDeDesarrollo = (): License => ({
  organizationId: PILOT_ORGANIZATION_ID,
  activationCode: PILOT_ACTIVATION_CODE,
  trialStart: getLocalTodayStr(),
  paidUntil: null,
  status: "trial",
  payments: [],
  usedPaymentCodes: [],
});

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

export interface RedeemResult {
  ok: boolean;
  meses?: number;
  error?: string;
}

export const useLicense = () => {
  const bypass = import.meta.env.VITE_BYPASS_AUTH === "true";
  const [storedLicense, setLicense] = useLocalStorage<License | null>(
    LICENSE_KEY,
    bypass ? licenciaDeDesarrollo() : null,
  );

  // Licencias creadas antes de los códigos de pago no traen este campo.
  const license: License | null = storedLicense
    ? {
        ...storedLicense,
        usedPaymentCodes: storedLicense.usedPaymentCodes ?? [],
      }
    : null;

  const hoy = getLocalTodayStr();
  const trialTranscurrido = license ? diasDesde(license.trialStart, hoy) : 0;
  const diasRestantes = Math.max(0, TRIAL_DAYS - trialTranscurrido);
  const suscripcionVigente = Boolean(
    license?.paidUntil && license.paidUntil >= hoy,
  );
  const isReadOnly = Boolean(license && !suscripcionVigente && diasRestantes === 0);

  const activate = (code: string): boolean => {
    if (!isValidActivationCode(code)) return false;

    setLicense({
      organizationId: PILOT_ORGANIZATION_ID,
      activationCode: PILOT_ACTIVATION_CODE,
      trialStart: getLocalTodayStr(),
      paidUntil: null,
      status: "trial",
      payments: [],
      usedPaymentCodes: [],
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
          { date: fechaActual, months: meses },
        ],
        usedPaymentCodes: prev.usedPaymentCodes ?? [],
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
          { date: fechaActual, months: datos.meses, code: normalizado },
        ],
        usedPaymentCodes: [...usados, normalizado],
      };
    });

    return { ok: true, meses: datos.meses };
  };

  return {
    license,
    bypass,
    isActivated: Boolean(license),
    diasRestantes,
    suscripcionVigente,
    isReadOnly,
    activate,
    setTrialStart,
    registerManualPayment,
    redeemPaymentCode,
  };
};
