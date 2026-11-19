import type { AppointmentFormData } from "../../components/schedule/AppointmentForm/AppointmentForm";

export type { ConsultationData, HospitalizationFormData } from "../../types/consultation";

export type TabType = "hoy" | "semana" | "mes";

export interface DayDetail {
  dateStr: string;
  title: string;
}

export interface EditingState {
  appointmentId?: string;
  initialFormData: Partial<AppointmentFormData>;
}
