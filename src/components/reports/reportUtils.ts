// ============================================
// UTILIDADES COMPARTIDAS POR LOS REPORTES
// ============================================

import type { Patient } from "../../types/patient";

/** Convierte una fecha ISO o fecha-hora a "aaaa-mm-dd". */
const aDiaIso = (valor: string): string => (valor ?? "").slice(0, 10);

/**
 * Indica si una fecha cae dentro del rango indicado.
 * Los rangos vacíos no filtran. Si los extremos vinieron invertidos se
 * normalizan para no dejar reportes vacíos por un desorden de captura.
 */
export const estaEnRangoFechas = (
  fecha: string,
  desde: string,
  hasta: string,
): boolean => {
  const dia = aDiaIso(fecha);
  if (!dia) return false;
  if (!desde && !hasta) return true;

  const invertido = Boolean(desde && hasta && desde > hasta);
  const inicio = invertido ? hasta : desde;
  const fin = invertido ? desde : hasta;

  if (inicio && dia < inicio) return false;
  if (fin && dia > fin) return false;
  return true;
};

/**
 * Fecha de referencia de una ficha: la actividad clínica más reciente de su
 * historial o, si no tiene registros, la fecha de creación del paciente.
 */
export const getFechaReferenciaPaciente = (patient: Patient): string => {
  const fechas = patient.history
    .map((registro) => aDiaIso(registro.date))
    .filter(Boolean);

  if (fechas.length === 0) return aDiaIso(patient.createdAt);
  return fechas.reduce((max, dia) => (dia > max ? dia : max));
};

/** Porcentaje entero de un parcial respecto del total. */
export const calcularPorcentaje = (parcial: number, total: number): number =>
  total > 0 ? Math.round((parcial / total) * 100) : 0;
