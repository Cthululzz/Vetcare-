export interface PrescriptionMedication {
  id: string;
  name: string;
  instructions: string;
}

import type { BranchScoped } from "./organization";

export interface Prescription extends BranchScoped {
  id: string;
  patientId: string;
  appointmentId: string;
  medications: PrescriptionMedication[];
  createdAt: string;
  notes?: string;
}
