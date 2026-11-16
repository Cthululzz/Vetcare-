// ============================================
// HISTORIAL CLÍNICO
// ============================================
// Utilidades para clasificar, ordenar y resumir los registros clínicos
// de un paciente. Los registros antiguos no tienen `type`, por lo que se
// infiere a partir del texto para no perder información.

import type { MedicalRecord, MedicalRecordType } from "../types/patient";
import { getLocalTodayStr } from "./dateUtils";

export const MEDICAL_RECORD_TYPES: MedicalRecordType[] = [
  "consulta",
  "vacunacion",
  "desparasitacion",
  "examen",
  "procedimiento",
  "hospitalizacion",
  "nota",
];

/** Tipos que se pueden crear manualmente desde el historial. */
export const MANUAL_RECORD_TYPES: MedicalRecordType[] =
  MEDICAL_RECORD_TYPES.filter((type) => type !== "hospitalizacion");

export const MEDICAL_RECORD_TYPE_LABELS: Record<MedicalRecordType, string> = {
  consulta: "Consulta",
  vacunacion: "Vacunación",
  desparasitacion: "Desparasitación",
  examen: "Examen",
  procedimiento: "Procedimiento",
  hospitalizacion: "Hospitalización",
  nota: "Nota clínica",
};

/** Devuelve solo la parte de fecha (aaaa-mm-dd) de un ISO o fecha simple. */
export const getRecordDateOnly = (date: string): string =>
  (date || "").split("T")[0];

/**
 * Determina el tipo de un registro. Los registros generados por la agenda y
 * hospitalización ya traen `type`; los antiguos se reconocen por su texto.
 */
export const getRecordType = (record: MedicalRecord): MedicalRecordType => {
  if (record.type) return record.type;

  const text = `${record.notes ?? ""} ${record.recommendations ?? ""}`
    .toLowerCase()
    .trim();

  if (
    text.includes("ingreso a hospitalización") ||
    text.includes("alta médica") ||
    text.startsWith("evolución") ||
    text.includes("hospitalizado")
  ) {
    return "hospitalizacion";
  }

  if (text.includes("vacuna") || text.includes("vacunación")) {
    return "vacunacion";
  }

  if (text.includes("desparasit")) return "desparasitacion";
  if (text.includes("examen") || text.includes("radiografía")) {
    return "examen";
  }

  return "consulta";
};

/** Ordena los registros desde el más reciente al más antiguo. */
export const sortMedicalRecords = (
  records: MedicalRecord[],
): MedicalRecord[] =>
  [...records].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

export interface ClinicalHistorySummary {
  total: number;
  consultations: number;
  lastRecord?: MedicalRecord;
  lastWeight?: { value: number; date: string };
  nextVisit?: { date: string; recordId: string };
}

/**
 * Resumen del historial: total, última atención, último peso y próximo control.
 * Solo considera próximos controles desde hoy en adelante.
 */
export const buildClinicalHistorySummary = (
  records: MedicalRecord[],
  today: string = getLocalTodayStr(),
): ClinicalHistorySummary => {
  const sorted = sortMedicalRecords(records);
  const withWeight = sorted.find(
    (record) => typeof record.weight === "number" && record.weight > 0,
  );

  const nextVisit = [...records]
    .filter((record) => {
      const date = getRecordDateOnly(record.nextVisitAt ?? "");
      return date !== "" && date >= today;
    })
    .sort((a, b) =>
      getRecordDateOnly(a.nextVisitAt!).localeCompare(
        getRecordDateOnly(b.nextVisitAt!),
      ),
    )[0];

  return {
    total: records.length,
    consultations: records.filter(
      (record) => getRecordType(record) === "consulta",
    ).length,
    lastRecord: sorted[0],
    lastWeight: withWeight
      ? { value: withWeight.weight as number, date: withWeight.date }
      : undefined,
    nextVisit: nextVisit
      ? {
          date: getRecordDateOnly(nextVisit.nextVisitAt as string),
          recordId: nextVisit.id,
        }
      : undefined,
  };
};

/** Cuenta registros por tipo para los filtros del historial. */
export const countRecordsByType = (
  records: MedicalRecord[],
): Record<MedicalRecordType, number> => {
  const counts = Object.fromEntries(
    MEDICAL_RECORD_TYPES.map((type) => [type, 0]),
  ) as Record<MedicalRecordType, number>;

  for (const record of records) {
    counts[getRecordType(record)] += 1;
  }

  return counts;
};
