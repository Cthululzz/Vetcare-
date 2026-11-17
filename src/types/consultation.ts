import type { MedicationPlanInput } from "../hooks/useHospitalizations";
import type { Appointment } from "./appointment";
import type { Owner, Patient } from "./patient";
import type { WeightUnit } from "../utils/weight";

/** Datos que se piden al confirmar una hospitalización desde la consulta. */
export interface HospitalizationFormData {
  reason: string;
  monitoringFrequency: number;
  medicationPlans: MedicationPlanInput[];
}

/** Información que viaja del modal de consulta a la persistencia. */
export interface ConsultationData {
  patient: Patient;
  owner: Owner;
  appointment: Appointment;
  notes: string;
  diagnosis?: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: number;
  weightUnit?: WeightUnit;
  recommendations?: string;
  shouldFinish: boolean;
  hospitalization?: HospitalizationFormData;
}
