import type {
  EspecieMascota,
  Genero,
  EstadoVacuna,
} from "../constants/appConstants";

export interface Owner {
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

export interface MedicalRecord {
  id: string;
  date: string;
  notes: string;
  weight?: number;
  recommendations?: string;
  /** Tipo de evento clínico. Los registros antiguos no lo tienen y se infieren. */
  type?: MedicalRecordType;
  /** Diagnóstico o resultado del examen. */
  diagnosis?: string;
  /** Profesional que registró la atención. */
  veterinarian?: string;
  /** Próximo control o visita recomendada (ISO "aaaa-mm-dd" o fecha-hora). */
  nextVisitAt?: string;
}

export interface Patient {
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
