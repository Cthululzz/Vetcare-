import type { WeightUnit } from "../utils/weight";
import type { SucursalId } from "../constants/appConstants";
import type { BranchScoped } from "./organization";

export type HospitalizationStatus = "activa" | "alta";

/**
 * Cama física de una sucursal. El nombre se repite entre sedes: la identidad
 * real de una cama es su alcance (organización + sucursal) más el nombre.
 */
export interface HospitalBed extends BranchScoped {
  name: string;
}

export interface HospitalizationEvolution {
  id: string;
  date: string; // ISO
  notes: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  treatmentChanges?: string;
  nursingObservations?: string;
  nextReviewAt?: string; // ISO
  createdBy?: string;
}

export interface MedicationAdministration {
  id: string;
  date: string; // ISO
  productId: string;
  productName: string;
  /** Cantidad administrada en la unidad del producto; también es el descuento de stock. */
  quantity: number;
  /** Unidad de medida del producto (ej. ml, mg, comprimido). */
  unit?: string;
  /** Dosis clínica de registros antiguos. Los nuevos usan quantity + unit. */
  dose?: number;
  doseUnit?: string;
  notes?: string;
  createdBy?: string;
  /** Plan de remedios al que pertenece esta dosis (si corresponde). */
  planId?: string;
  /** Horario programado de la dosis, para dejar trazabilidad del atraso. */
  scheduledAt?: string; // ISO
}

/**
 * Plan de remedios de un paciente hospitalizado.
 * El horario se controla con `nextDoseAt`, que avanza al administrar cada dosis.
 */
export interface MedicationPlan {
  id: string;
  productId: string;
  productName: string;
  /** Cantidad por dosis, en la unidad de control del producto. */
  dose: number;
  unit?: string;
  /** Horas entre dosis (2, 4, 6, 8, 12, 24...). */
  frequencyHours: number;
  startedAt: string; // ISO
  /** Próxima dosis programada. */
  nextDoseAt: string; // ISO
  /** Duración del tratamiento en días (opcional). */
  durationDays?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

export interface DischargeSummary {
  dischargedAt: string; // ISO
  diagnosis: string;
  treatment: string;
  indications: string;
  nextControlAt?: string; // ISO
  dischargedBy?: string;
}

export interface Hospitalization extends BranchScoped {
  id: string;
  patientId: string;
  admittedAt: string; // ISO
  reason?: string;
  status: HospitalizationStatus;
  dischargedAt?: string;
  notes?: string;

  // Datos de internación
  bed?: string;
  diagnosis?: string;
  /** Peso del paciente al momento del ingreso. */
  weightAtAdmission?: number;
  /** Unidad del peso de ingreso. Si falta, se interpreta como kg. */
  weightAtAdmissionUnit?: WeightUnit;
  monitoringFrequency?: number; // horas entre revisiones
  nextReviewAt?: string; // ISO
  /** Sucursal donde está físicamente la cama del paciente. */
  sucursalId: SucursalId;
  createdBy?: string;

  // Seguimiento clínico
  evolutions?: HospitalizationEvolution[];
  medications?: MedicationAdministration[];
  /** Plan de remedios con horarios y recordatorios. */
  medicationPlans?: MedicationPlan[];
  dischargeSummary?: DischargeSummary;
}
