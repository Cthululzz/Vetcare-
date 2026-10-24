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

export interface MedicalRecord {
  id: string;
  date: string;
  notes: string;
  weight?: number;
  recommendations?: string;
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
