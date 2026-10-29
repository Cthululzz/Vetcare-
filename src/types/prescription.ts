export interface PrescriptionMedication {
  id: string;
  name: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId: string;
  medications: PrescriptionMedication[];
  createdAt: string;
  notes?: string;
}
