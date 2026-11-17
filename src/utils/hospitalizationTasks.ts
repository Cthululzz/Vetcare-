// ============================================
// TAREAS Y ALERTAS DE HOSPITALIZACIÓN
// ============================================
// Se derivan de los datos: no se guardan tareas aparte.
// - Tarea pendiente: vence dentro de las próximas 24 horas.
// - Alerta activa: ya venció (con una tolerancia breve para medicación).
// Alimenta las tarjetas del dashboard y la página /tareas.

import type { Hospitalization, MedicationPlan } from "../types/hospitalization";
import type { Patient } from "../types/patient";
import { formatFractionWithUnit } from "./inventoryUnits";

/** Minutos de tolerancia antes de marcar una dosis como atrasada. */
export const MEDICATION_GRACE_MINUTES = 15;

/** Ventana hacia adelante para considerar una tarea como pendiente. */
export const TASK_HORIZON_HOURS = 24;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export type HospitalizationTaskType = "medicacion" | "revision";

export interface HospitalizationTask {
  id: string;
  type: HospitalizationTaskType;
  hospitalizationId: string;
  patientId: string;
  patientName: string;
  bed?: string;
  title: string;
  detail?: string;
  dueAt: string; // ISO
  overdue: boolean;
}

/**
 * Construye todas las tareas clínicas de las hospitalizaciones activas.
 */
export const buildHospitalizationTasks = (
  hospitalizations: Hospitalization[],
  getPatient: (patientId: string) => Patient | undefined,
  now: number = Date.now(),
): HospitalizationTask[] => {
  const tasks: HospitalizationTask[] = [];

  for (const hospitalization of hospitalizations) {
    if (hospitalization.status !== "activa") continue;

    const patient = getPatient(hospitalization.patientId);
    if (!patient || !patient.isActive) continue;

    for (const plan of hospitalization.medicationPlans ?? []) {
      if (!plan.isActive || !plan.nextDoseAt) continue;

      const dueAt = new Date(plan.nextDoseAt).getTime();
      if (Number.isNaN(dueAt)) continue;

      const doseLabel = plan.unit
        ? formatFractionWithUnit(plan.dose, plan.unit)
        : String(plan.dose);

      tasks.push({
        id: `med-${plan.id}`,
        type: "medicacion",
        hospitalizationId: hospitalization.id,
        patientId: patient.id,
        patientName: patient.name,
        bed: hospitalization.bed,
        title: plan.productName,
        detail: `${doseLabel} · cada ${plan.frequencyHours} h`,
        dueAt: plan.nextDoseAt,
        overdue: now > dueAt + MEDICATION_GRACE_MINUTES * MINUTE_MS,
      });
    }

    if (hospitalization.nextReviewAt) {
      const dueAt = new Date(hospitalization.nextReviewAt).getTime();
      if (!Number.isNaN(dueAt)) {
        tasks.push({
          id: `review-${hospitalization.id}`,
          type: "revision",
          hospitalizationId: hospitalization.id,
          patientId: patient.id,
          patientName: patient.name,
          bed: hospitalization.bed,
          title: "Revisión clínica",
          detail: `Control de ${patient.name}`,
          dueAt: hospitalization.nextReviewAt,
          overdue: now > dueAt,
        });
      }
    }
  }

  return tasks.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
};

/**
 * Indica si alguna tarea tiene la hora ya llegada (o vencida).
 * Las tareas programadas para más adelante no requieren acción todavía.
 */
export const hasTasksDueNow = (
  tasks: HospitalizationTask[],
  now: number = Date.now(),
): boolean =>
  tasks.some((task) => new Date(task.dueAt).getTime() <= now);

/**
 * Separa las tareas en pendientes (próximas 24 h) y alertas (vencidas).
 */
export const splitHospitalizationTasks = (
  tasks: HospitalizationTask[],
  now: number = Date.now(),
): {
  pending: HospitalizationTask[];
  overdue: HospitalizationTask[];
} => {
  const horizon = now + TASK_HORIZON_HOURS * HOUR_MS;
  const pending: HospitalizationTask[] = [];
  const overdue: HospitalizationTask[] = [];

  for (const task of tasks) {
    if (task.overdue) {
      overdue.push(task);
      continue;
    }

    const dueAt = new Date(task.dueAt).getTime();
    if (!Number.isNaN(dueAt) && dueAt <= horizon) {
      pending.push(task);
    }
  }

  return { pending, overdue };
};

/**
 * Indica si la dosis programada de un plan ya superó la tolerancia.
 * Vive en utils para que las pantallas no calculen el tiempo durante el render.
 */
export const isMedicationPlanOverdue = (
  plan: Pick<MedicationPlan, "isActive" | "nextDoseAt">,
  now: number = Date.now(),
): boolean => {
  if (!plan.isActive || !plan.nextDoseAt) return false;
  const dueAt = new Date(plan.nextDoseAt).getTime();
  if (Number.isNaN(dueAt)) return false;
  return now > dueAt + MEDICATION_GRACE_MINUTES * MINUTE_MS;
};

/**
 * Construye y separa las tareas en una sola pasada, con un único "ahora".
 */
export const buildHospitalizationTaskGroups = (
  hospitalizations: Hospitalization[],
  getPatient: (patientId: string) => Patient | undefined,
): {
  pending: HospitalizationTask[];
  overdue: HospitalizationTask[];
} => {
  const now = Date.now();
  const tasks = buildHospitalizationTasks(hospitalizations, getPatient, now);
  return splitHospitalizationTasks(tasks, now);
};
