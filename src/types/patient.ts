// src/types/patient.ts
export interface Patient {
  id: string;
  name: string;
  species: string; // ej: "Gato", "Perro"
  breed?: string; // 👈 Agrega esta línea para soportar la raza de forma independiente
  age: string; // ej: "8 años"
  gender: string; // ej: "Hembra", "Macho"
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  microchip?: string;
  vaccineStatus: string; // ej: "Vacunas al día"
  nextAppointment: string; // ej: "Hoy", "12 de Agosto", etc.
  statusBadge?: string; // ej: "Con cita hoy", "Hospitalizado"
  history?: Array<{
    date: string;
    time?: string; // 👈 Añade esta línea aquí
    notes: string;
    weight: string;
    recommendations: string;
  }>;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  petsCount: number;
}
