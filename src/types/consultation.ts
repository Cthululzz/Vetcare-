import type { MedicationPlanInput } from "../hooks/useHospitalizations";
import type { Appointment } from "./appointment";
import type { Owner, Patient } from "./patient";
import type { WeightUnit } from "../utils/weight";
import type { ExamOrder } from "./examOrder";
import type { Prescription } from "./prescription";

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
  /** Orden de exámenes indicada durante la consulta. */
  examOrder?: ExamOrder;
}

/** Documentos listos para imprimir al terminar una consulta. */
export interface FinishPrintDocuments {
  patientName: string;
  veterinarian?: string;
  /** Solo presente cuando se creó efectivamente una receta. */
  prescription?: Prescription;
  /** Solo presente cuando la orden tiene al menos una categoría. */
  examOrder?: ExamOrder;
}
