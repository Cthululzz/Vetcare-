export type HospitalizationStatus = "activa" | "alta";

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
  quantity: number;
  unit?: string;
  notes?: string;
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

export interface Hospitalization {
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
  monitoringFrequency?: number; // horas entre revisiones
  nextReviewAt?: string; // ISO
  sucursalId?: string;
  createdBy?: string;

  // Seguimiento clínico
  evolutions?: HospitalizationEvolution[];
  medications?: MedicationAdministration[];
  dischargeSummary?: DischargeSummary;
}
