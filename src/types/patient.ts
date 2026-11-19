import type {
  EspecieMascota,
  Genero,
  EstadoVacuna,
} from "../constants/appConstants";
import type { WeightUnit } from "../utils/weight";
import type { BranchScoped } from "./organization";

export interface Owner extends BranchScoped {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export type MedicalRecordType =
  | "consulta"
  | "vacunacion"
  | "desparasitacion"
  | "examen"
  | "procedimiento"
  | "hospitalizacion"
  | "nota";

export interface MedicalRecord extends BranchScoped {
  id: string;
  date: string;
  notes: string;
  weight?: number;
  /** Unidad del peso. Si falta, se interpreta como kg (registros antiguos). */
  weightUnit?: WeightUnit;
  recommendations?: string;
  /** Tipo de evento clínico. Los registros antiguos no lo tienen y se infieren. */
  type?: MedicalRecordType;
  /** Diagnóstico o resultado del examen. */
  diagnosis?: string;
  /** Signos vitales de la consulta; "normal" si se dejaron vacíos. */
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  /** Profesional que registró la atención. */
  veterinarian?: string;
  /** Próximo control o visita recomendada (ISO "aaaa-mm-dd" o fecha-hora). */
  nextVisitAt?: string;
  /** Orden de exámenes indicada en la consulta. */
  examOrder?: import("./examOrder").ExamOrder;
}

export interface Patient extends BranchScoped {
  id: string;
  name: string;
  species: EspecieMascota;
  breed?: string;
  age?: string; // ← NUEVO: edad registrada como texto (ej. "3 años y 2 meses")
  birthDate?: string;
  birthDateApproximate?: boolean;
  gender: Genero;
  ownerId: string;
  microchip?: string;
  vaccineStatus: EstadoVacuna;
  history: MedicalRecord[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  conditions?: string;
}
