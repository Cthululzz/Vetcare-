// ============================================
// CÓDIGOS DE PAGO DE LA ETAPA PILOTO
// ============================================
// El proveedor genera un código por pago recibido. El código lleva año,
// consecutivo y meses, y una firma corta calculada con una frase fija. No es
// criptografía: sirve para el piloto offline. La firma real llegará con Tauri.

const SECRETO = "vetcare-piloto-pagos-2026";
const ANIO_POR_DEFECTO = 2026;

export const firmaCorta = (payload: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 6);
};

export const normalizePaymentCode = (value: string): string =>
  value.toUpperCase().replace(/[\s-]/g, "");

export interface PaymentCodeData {
  anio: number;
  secuencia: number;
  meses: number;
}

export const buildPaymentCode = (
  secuencia: number,
  meses: number,
  anio: number = ANIO_POR_DEFECTO,
): string => {
  const consecutivo = String(secuencia).padStart(3, "0");
  const duracion = String(meses).padStart(2, "0");
  const payload = `VETCARE|${anio}|${consecutivo}|${duracion}|${SECRETO}`;
  return `VETPAGO-${anio}-${consecutivo}-${duracion}M-${firmaCorta(payload)}`;
};

export const parsePaymentCode = (value: string): PaymentCodeData | null => {
  const normalized = normalizePaymentCode(value);
  const match = /^VETPAGO(\d{4})(\d{3})(\d{2})M([0-9A-F]{6})$/.exec(normalized);
  if (!match) return null;

  const anio = Number(match[1]);
  const secuencia = Number(match[2]);
  const meses = Number(match[3]);
  if (!anio || !secuencia || meses <= 0) return null;

  const payload = `VETCARE|${anio}|${match[2]}|${match[3]}|${SECRETO}`;
  if (firmaCorta(payload) !== match[4]) return null;

  return { anio, secuencia, meses };
};
