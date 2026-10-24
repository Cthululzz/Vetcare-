import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { Hospitalization } from "../types/hospitalization";
import { usePatients } from "./usePatients";
import type { Patient } from "../types/patient";

const HOSPITALIZATIONS_KEY = "vet_hospitalizations";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export interface ActiveHospitalization {
  hospitalization: Hospitalization;
  patient: Patient;
}

export function useHospitalizations() {
  const [hospitalizations, setHospitalizations] = useLocalStorage<
    Hospitalization[]
  >(HOSPITALIZATIONS_KEY, []);

  const { getPatient } = usePatients();

  // ---------- ACCIONES ----------

  const admitPatient = useCallback(
    (patientId: string, reason?: string): Hospitalization => {
      const record: Hospitalization = {
        id: generateId(),
        patientId,
        admittedAt: isoNow(),
        reason,
        status: "activa",
      };
      setHospitalizations((prev) => [...prev, record]);
      return record;
    },
    [setHospitalizations],
  );

  const dischargePatient = useCallback(
    (hospitalizationId: string) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? { ...h, status: "alta" as const, dischargedAt: isoNow() }
            : h,
        ),
      );
    },
    [setHospitalizations],
  );

  // ---------- CONSULTAS ----------

  /**
   * Hospitalizaciones activas, enriquecidas con el paciente.
   */
  const getActiveHospitalizations = useCallback((): ActiveHospitalization[] => {
    return hospitalizations
      .filter((h) => h.status === "activa")
      .map((h) => ({
        hospitalization: h,
        patient: getPatient(h.patientId),
      }))
      .filter((x): x is ActiveHospitalization =>
        Boolean(x.patient && x.patient.isActive),
      );
  }, [hospitalizations, getPatient]);

  const isHospitalized = useCallback(
    (patientId: string): boolean =>
      hospitalizations.some(
        (h) => h.patientId === patientId && h.status === "activa",
      ),
    [hospitalizations],
  );

  const getHospitalizationsByPatient = useCallback(
    (patientId: string): Hospitalization[] =>
      hospitalizations.filter((h) => h.patientId === patientId),
    [hospitalizations],
  );

  return {
    hospitalizations,
    admitPatient,
    dischargePatient,
    getActiveHospitalizations,
    isHospitalized,
    getHospitalizationsByPatient,
  };
}
