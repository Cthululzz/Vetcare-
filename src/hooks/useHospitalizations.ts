import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type {
  DischargeSummary,
  Hospitalization,
  HospitalizationEvolution,
  MedicationAdministration,
  MedicationPlan,
} from "../types/hospitalization";
import { usePatients } from "./usePatients";
import type { Patient } from "../types/patient";
import {
  DEFAULT_MONITORING_FREQUENCY,
  calcularProximaRevision,
} from "../constants/hospitalization";
import { useHospitalBeds } from "./useHospitalBeds";
import type { WeightUnit } from "../utils/weight";

const HOSPITALIZATIONS_KEY = "vet_hospitalizations";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Una internación solo cuenta como activa si su paciente todavía existe y
 * está activo. Esto evita que un registro huérfano (paciente eliminado o dado
 * de baja) deje una cama marcada como ocupada sin paciente visible.
 */
export function isActiveHospitalization(
  hospitalization: Hospitalization,
  getPatient: (patientId: string) => Patient | undefined,
): boolean {
  return (
    hospitalization.status === "activa" &&
    Boolean(getPatient(hospitalization.patientId)?.isActive)
  );
}

/**
 * Camas ocupadas por internaciones activas con paciente visible.
 * Se deriva de los datos: no se guarda un estado de ocupación aparte.
 */
export function getOccupiedBeds(
  hospitalizations: Hospitalization[],
  getPatient: (patientId: string) => Patient | undefined,
): Map<string, Hospitalization> {
  const occupied = new Map<string, Hospitalization>();

  for (const hospitalization of hospitalizations) {
    if (
      hospitalization.bed &&
      isActiveHospitalization(hospitalization, getPatient)
    ) {
      occupied.set(hospitalization.bed, hospitalization);
    }
  }

  return occupied;
}

/**
 * Una revisión está pendiente si aún no se programó o si ya venció.
 */
export function isReviewPending(hospitalization: Hospitalization): boolean {
  if (hospitalization.status !== "activa") return false;
  if (!hospitalization.nextReviewAt) return true;
  return new Date(hospitalization.nextReviewAt).getTime() <= Date.now();
}

/**
 * Una revisión está vencida si tenía fecha programada y ya pasó.
 */
export function isReviewOverdue(hospitalization: Hospitalization): boolean {
  if (hospitalization.status !== "activa") return false;
  if (!hospitalization.nextReviewAt) return false;
  return new Date(hospitalization.nextReviewAt).getTime() <= Date.now();
}

export interface ActiveHospitalization {
  hospitalization: Hospitalization;
  patient: Patient;
}

export interface AdmitPatientOptions {
  bed?: string;
  diagnosis?: string;
  weight?: number;
  weightUnit?: WeightUnit;
  monitoringFrequency?: number;
  nextReviewAt?: string;
  notes?: string;
  sucursalId?: string;
  createdBy?: string;
  /** Planes de remedios que se crean junto con el ingreso. */
  medicationPlans?: MedicationPlanInput[];
}

export interface DischargeDetails {
  diagnosis: string;
  treatment: string;
  indications: string;
  nextControlAt?: string;
  dischargedBy?: string;
}

/**
 * Datos para crear o editar un plan de remedios.
 * `startedAt` es el horario de la primera dosis.
 */
export interface MedicationPlanInput {
  productId: string;
  productName: string;
  dose: number;
  unit?: string;
  frequencyHours: number;
  startedAt: string;
  durationDays?: number;
  notes?: string;
}

export interface AdministerPlanDoseInput {
  notes?: string;
  createdBy?: string;
}

export function useHospitalizations() {
  const [hospitalizations, setHospitalizations] = useLocalStorage<
    Hospitalization[]
  >(HOSPITALIZATIONS_KEY, []);

  const { getPatient } = usePatients();
  const { beds } = useHospitalBeds();

  // ---------- ACCIONES ----------

  /**
   * Registra un ingreso. Devuelve `null` si el paciente ya está hospitalizado
   * o si la cama solicitada está ocupada.
   */
  const admitPatient = useCallback(
    (
      patientId: string,
      reason?: string,
      options?: AdmitPatientOptions,
    ): Hospitalization | null => {
      const alreadyAdmitted = hospitalizations.some(
        (h) => h.patientId === patientId && h.status === "activa",
      );
      if (alreadyAdmitted) return null;

      const occupiedBeds = getOccupiedBeds(hospitalizations, getPatient);
      let bed = options?.bed?.trim() || undefined;

      if (bed && occupiedBeds.has(bed)) return null;

      if (!bed) {
        bed = beds.find((b) => !occupiedBeds.has(b));
      }

      const monitoringFrequency =
        options?.monitoringFrequency ?? DEFAULT_MONITORING_FREQUENCY;
      const nextReviewAt =
        options?.nextReviewAt ??
        calcularProximaRevision(monitoringFrequency);

      // Los planes se crean en el mismo ingreso para evitar usar un snapshot
      // de `hospitalizations` que todavía no incluye el registro recién creado.
      const medicationPlans: MedicationPlan[] = (
        options?.medicationPlans ?? []
      ).map((plan) => ({
        ...plan,
        id: generateId(),
        nextDoseAt: plan.startedAt,
        isActive: true,
        createdAt: isoNow(),
        createdBy: options?.createdBy,
      }));

      const record: Hospitalization = {
        id: generateId(),
        patientId,
        admittedAt: isoNow(),
        reason,
        status: "activa",
        bed,
        diagnosis: options?.diagnosis,
        weightAtAdmission: options?.weight,
        weightAtAdmissionUnit: options?.weightUnit,
        monitoringFrequency,
        nextReviewAt,
        notes: options?.notes,
        sucursalId: options?.sucursalId,
        createdBy: options?.createdBy,
        evolutions: [],
        medications: [],
        medicationPlans,
      };

      setHospitalizations((prev) => [...prev, record]);
      return record;
    },
    [hospitalizations, beds, getPatient, setHospitalizations],
  );

  const updateHospitalization = useCallback(
    (hospitalizationId: string, updates: Partial<Hospitalization>) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId ? { ...h, ...updates } : h,
        ),
      );
    },
    [setHospitalizations],
  );

  /**
   * Mueve una internación activa a otra cama libre.
   * Devuelve `false` si la cama no existe, está ocupada o la internación
   * ya no está activa.
   */
  const changeBed = useCallback(
    (hospitalizationId: string, newBed: string): boolean => {
      const target = hospitalizations.find(
        (h) => h.id === hospitalizationId,
      );
      if (!target || target.status !== "activa") return false;

      const bed = newBed.trim();
      if (!bed || !beds.includes(bed)) return false;
      if (target.bed === bed) return true;

      const occupiedBeds = getOccupiedBeds(hospitalizations, getPatient);
      if (occupiedBeds.has(bed)) return false;

      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId ? { ...h, bed } : h,
        ),
      );

      return true;
    },
    [hospitalizations, beds, getPatient, setHospitalizations],
  );

  /**
   * Agrega una evolución al registro de internación.
   */
  const addEvolution = useCallback(
    (
      hospitalizationId: string,
      data: Omit<HospitalizationEvolution, "id" | "date"> & { date?: string },
    ): HospitalizationEvolution | null => {
      const target = hospitalizations.find(
        (h) => h.id === hospitalizationId,
      );
      if (!target) return null;

      const evolution: HospitalizationEvolution = {
        id: generateId(),
        date: data.date ?? isoNow(),
        notes: data.notes,
        temperature: data.temperature,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        treatmentChanges: data.treatmentChanges,
        nursingObservations: data.nursingObservations,
        nextReviewAt: data.nextReviewAt,
        createdBy: data.createdBy,
      };

      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                evolutions: [...(h.evolutions ?? []), evolution],
                nextReviewAt: evolution.nextReviewAt ?? h.nextReviewAt,
              }
            : h,
        ),
      );

      return evolution;
    },
    [hospitalizations, setHospitalizations],
  );

  /**
   * Registra una medicación administrada durante la hospitalización.
   * El descuento de stock lo realiza quien invoca (useInventoryMovements).
   */
  const addMedicationAdministration = useCallback(
    (
      hospitalizationId: string,
      data: Omit<MedicationAdministration, "id" | "date">,
    ): MedicationAdministration | null => {
      const target = hospitalizations.find(
        (h) => h.id === hospitalizationId,
      );
      if (!target) return null;

      const administration: MedicationAdministration = {
        id: generateId(),
        date: isoNow(),
        ...data,
      };

      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medications: [...(h.medications ?? []), administration],
              }
            : h,
        ),
      );

      return administration;
    },
    [hospitalizations, setHospitalizations],
  );

  /**
   * Actualiza una medicación ya registrada (dosis, notas o descuento de stock).
   * El ajuste de stock lo realiza quien invoca (useInventoryMovements).
   */
  const updateMedicationAdministration = useCallback(
    (
      hospitalizationId: string,
      administrationId: string,
      updates: Partial<
        Pick<
          MedicationAdministration,
          "dose" | "doseUnit" | "quantity" | "unit" | "notes"
        >
      >,
    ) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medications: (h.medications ?? []).map((medication) =>
                  medication.id === administrationId
                    ? { ...medication, ...updates }
                    : medication,
                ),
              }
            : h,
        ),
      );
    },
    [setHospitalizations],
  );

  const removeMedicationAdministration = useCallback(
    (hospitalizationId: string, administrationId: string) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medications: (h.medications ?? []).filter(
                  (medication) => medication.id !== administrationId,
                ),
              }
            : h,
        ),
      );
    },
    [setHospitalizations],
  );

  /**
   * Crea un plan de remedios. La primera dosis queda programada en `startedAt`
   * y desde ahí avanza según `frequencyHours`.
   */
  const addMedicationPlan = useCallback(
    (
      hospitalizationId: string,
      data: MedicationPlanInput,
      createdBy?: string,
    ): MedicationPlan | null => {
      const target = hospitalizations.find(
        (h) => h.id === hospitalizationId,
      );
      if (!target || target.status !== "activa") return null;

      const plan: MedicationPlan = {
        ...data,
        id: generateId(),
        nextDoseAt: data.startedAt,
        isActive: true,
        createdAt: isoNow(),
        createdBy,
      };

      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medicationPlans: [...(h.medicationPlans ?? []), plan],
              }
            : h,
        ),
      );

      return plan;
    },
    [hospitalizations, setHospitalizations],
  );

  /**
   * Edita un plan. Si cambia el horario de inicio, se reinicia la próxima dosis.
   */
  const updateMedicationPlan = useCallback(
    (
      hospitalizationId: string,
      planId: string,
      updates: Partial<MedicationPlanInput>,
    ) => {
      setHospitalizations((prev) =>
        prev.map((h) => {
          if (h.id !== hospitalizationId) return h;
          return {
            ...h,
            medicationPlans: (h.medicationPlans ?? []).map((plan) =>
              plan.id === planId
                ? {
                    ...plan,
                    ...updates,
                    nextDoseAt: updates.startedAt ?? plan.nextDoseAt,
                  }
                : plan,
            ),
          };
        }),
      );
    },
    [setHospitalizations],
  );

  /**
   * Activa o detiene un plan sin borrar su historial de administraciones.
   */
  const setMedicationPlanActive = useCallback(
    (
      hospitalizationId: string,
      planId: string,
      isActive: boolean,
    ) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medicationPlans: (h.medicationPlans ?? []).map((plan) =>
                  plan.id === planId ? { ...plan, isActive } : plan,
                ),
              }
            : h,
        ),
      );
    },
    [setHospitalizations],
  );

  const removeMedicationPlan = useCallback(
    (hospitalizationId: string, planId: string) => {
      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medicationPlans: (h.medicationPlans ?? []).filter(
                  (plan) => plan.id !== planId,
                ),
              }
            : h,
        ),
      );
    },
    [setHospitalizations],
  );

  /**
   * Administra la dosis programada de un plan y avanza el horario.
   * El descuento de stock lo realiza quien invoca (useInventoryMovements).
   */
  const administerPlanDose = useCallback(
    (
      hospitalizationId: string,
      planId: string,
      input?: AdministerPlanDoseInput,
    ): MedicationAdministration | null => {
      const target = hospitalizations.find(
        (h) => h.id === hospitalizationId,
      );
      if (!target || target.status !== "activa") return null;

      const plan = (target.medicationPlans ?? []).find(
        (item) => item.id === planId && item.isActive,
      );
      if (!plan) return null;

      const scheduledAt = plan.nextDoseAt;
      const administration: MedicationAdministration = {
        id: generateId(),
        date: isoNow(),
        productId: plan.productId,
        productName: plan.productName,
        quantity: plan.dose,
        unit: plan.unit,
        notes: input?.notes,
        createdBy: input?.createdBy,
        planId: plan.id,
        scheduledAt,
      };

      const nextDoseAt = new Date(
        new Date(scheduledAt).getTime() + plan.frequencyHours * 60 * 60 * 1000,
      ).toISOString();

      const endAt = plan.durationDays
        ? new Date(plan.startedAt).getTime() +
          plan.durationDays * 24 * 60 * 60 * 1000
        : null;
      const isActive = endAt === null || new Date(nextDoseAt).getTime() < endAt;

      setHospitalizations((prev) =>
        prev.map((h) =>
          h.id === hospitalizationId
            ? {
                ...h,
                medications: [...(h.medications ?? []), administration],
                medicationPlans: (h.medicationPlans ?? []).map((item) =>
                  item.id === planId
                    ? { ...item, nextDoseAt, isActive }
                    : item,
                ),
              }
            : h,
        ),
      );

      return administration;
    },
    [hospitalizations, setHospitalizations],
  );

  const dischargePatient = useCallback(
    (hospitalizationId: string, details?: DischargeDetails) => {
      const dischargedAt = isoNow();

      setHospitalizations((prev) =>
        prev.map((h) => {
          if (h.id !== hospitalizationId) return h;

          const dischargeSummary: DischargeSummary | undefined = details
            ? { ...details, dischargedAt }
            : h.dischargeSummary;

          return {
            ...h,
            status: "alta" as const,
            dischargedAt,
            nextReviewAt: undefined,
            dischargeSummary,
          };
        }),
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
      .filter((h) => isActiveHospitalization(h, getPatient))
      .map((h) => ({
        hospitalization: h,
        patient: getPatient(h.patientId),
      }))
      .filter((x): x is ActiveHospitalization => Boolean(x.patient));
  }, [hospitalizations, getPatient]);

  /**
   * Historial de altas, más recientes primero.
   */
  const getDischargedHospitalizations =
    useCallback((): ActiveHospitalization[] => {
      return hospitalizations
        .filter((h) => h.status === "alta")
        .map((h) => ({
          hospitalization: h,
          patient: getPatient(h.patientId),
        }))
        .filter((x): x is ActiveHospitalization =>
          Boolean(x.patient && x.patient.isActive),
        )
        .sort((a, b) =>
          (b.hospitalization.dischargedAt ?? b.hospitalization.admittedAt).localeCompare(
            a.hospitalization.dischargedAt ?? a.hospitalization.admittedAt,
          ),
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

  /**
   * Camas libres según las internaciones activas.
   */
  const getAvailableBeds = useCallback((): string[] => {
    const occupied = getOccupiedBeds(hospitalizations, getPatient);
    return beds.filter((bed) => !occupied.has(bed));
  }, [hospitalizations, beds, getPatient]);

  /**
   * Indica si una cama está ocupada por otra internación activa.
   */
  const isBedOccupied = useCallback(
    (bed: string, exceptHospitalizationId?: string): boolean =>
      hospitalizations.some(
        (h) =>
          h.bed === bed &&
          h.id !== exceptHospitalizationId &&
          isActiveHospitalization(h, getPatient),
      ),
    [hospitalizations, getPatient],
  );

  return {
    hospitalizations,
    admitPatient,
    updateHospitalization,
    changeBed,
    addEvolution,
    addMedicationAdministration,
    updateMedicationAdministration,
    removeMedicationAdministration,
    addMedicationPlan,
    updateMedicationPlan,
    setMedicationPlanActive,
    removeMedicationPlan,
    administerPlanDose,
    dischargePatient,
    getActiveHospitalizations,
    getDischargedHospitalizations,
    isHospitalized,
    getHospitalizationsByPatient,
    getAvailableBeds,
    isBedOccupied,
  };
}
