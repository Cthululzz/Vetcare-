export type HospitalizationStatus = "activa" | "alta";

export interface Hospitalization {
  id: string;
  patientId: string;
  admittedAt: string; // ISO
  reason?: string;
  status: HospitalizationStatus;
  dischargedAt?: string;
  notes?: string;
}
