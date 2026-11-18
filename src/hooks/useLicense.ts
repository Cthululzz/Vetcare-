import { useLocalStorage } from "./useLocalStorage";
import { getLocalTodayStr } from "../utils/dateUtils";
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

export const useLicense = () => {
  const bypass = import.meta.env.VITE_BYPASS_AUTH === "true";
  const [license, setLicense] = useLocalStorage<License | null>(
    LICENSE_KEY,
    bypass ? licenciaDeDesarrollo() : null,
  );

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
    });
    return true;
  };

  const setTrialStart = (fecha: string): void => {
    setLicense((prev) => (prev ? { ...prev, trialStart: fecha } : prev));
  };

  const registerManualPayment = (meses: number): void => {
    if (meses <= 0) return;
    const hoy = getLocalTodayStr();
    setLicense((prev) => {
      if (!prev) return prev;
      const base =
        prev.paidUntil && new Date(`${prev.paidUntil}T00:00:00`) > new Date()
          ? prev.paidUntil
          : hoy;
      return {
        ...prev,
        paidUntil: sumarMeses(base, meses),
        status: "active",
        payments: [...prev.payments, { date: hoy, months: meses }],
      };
    });
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
  };
};
