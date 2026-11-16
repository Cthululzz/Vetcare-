import type { Appointment } from "../../types/appointment";
import type { Patient, Owner } from "../../types/patient";
import type { WeightUnit } from "../../utils/weight";

export type TabType = "hoy" | "semana" | "mes";

export interface DayDetail {
  dateStr: string;
  title: string;
}

export interface ConsultationData {
  patient: Patient;
  owner: Owner;
  appointment: Appointment;
  notes: string;
  weight?: number;
  weightUnit?: WeightUnit;
  recommendations?: string;
  shouldFinish: boolean;
}

export interface EditingState {
  appointmentId?: string;
  initialFormData: any;
}
