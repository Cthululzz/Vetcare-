// ============================================
// ACTUALIZACIONES DE LICENCIA DEL PROVEEDOR
// ============================================
// El proveedor decide la extensión desde su equipo y genera un código ligado a
// una veterinaria base. La clínica solo lo pega; el código no sirve para otra
// organización. Sigue siendo una firma corta de piloto, no criptografía.

import { firmaCorta } from "./paymentCodes";

const SECRETO = "vetcare-piloto-actualizaciones-2026";

const aHex = (value: string): string =>
  Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
    .join("");

const deHex = (value: string): string => {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = parseInt(value.slice(index, index + 2), 16);
  }
  return new TextDecoder().decode(bytes);
};

export const normalizeUpdateCode = (value: string): string =>
  value.toUpperCase().replace(/\s/g, "");

export interface ProviderUpdateData {
  organizationId: string;
  paidUntil: string;
  months: number;
}

export const buildProviderUpdateCode = (
  organizationId: string,
  paidUntil: string,
  months: number,
): string => {
  const organizacionHex = aHex(organizationId);
  const fecha = paidUntil.replace(/-/g, "");
  const duracion = String(months).padStart(2, "0");
  const payload = `VETEXT|${organizacionHex}|${fecha}|${duracion}|${SECRETO}`;

  return `VETEXT-${organizacionHex}-${fecha}-${duracion}-${firmaCorta(payload)}`;
};

export const parseProviderUpdateCode = (
  value: string,
): ProviderUpdateData | null => {
  const normalized = normalizeUpdateCode(value);
  const match =
    /^VETEXT-([0-9A-F]+)-(\d{8})-(\d{2})-([0-9A-F]{6})$/.exec(normalized);
  if (!match) return null;

  const fechaCompacta = match[2];
  const paidUntil = `${fechaCompacta.slice(0, 4)}-${fechaCompacta.slice(4, 6)}-${fechaCompacta.slice(6, 8)}`;
  const months = Number(match[3]);
  if (!months) return null;

  const payload = `VETEXT|${match[1]}|${fechaCompacta}|${match[3]}|${SECRETO}`;
  if (firmaCorta(payload) !== match[4]) return null;

  try {
    const organizationId = deHex(match[1]);
    if (!organizationId) return null;
    return { organizationId, paidUntil, months };
  } catch {
    return null;
  }
};
