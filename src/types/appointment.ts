import type {
  SucursalId,
  DoctorId,
  TipoCita,
  EstadoCita,
} from "../constants/appConstants";
import type { WeightUnit } from "../utils/weight";

export interface Appointment {
  id: string;

  // --- Relaciones (IDs, no datos duplicados) ---
  patientId: string;
  ownerId: string;
  doctorId: DoctorId;
  sucursalId: SucursalId;

  // --- Datos de la cita ---
  fecha: string; // ISO: "2026-08-14"
  hora: string; // 24h: "10:30"
  motivo: string;
  tipo: TipoCita;
  status: EstadoCita;

  // --- Notas médicas (solo si aplican) ---
  alergiasNotas?: string;
  condicionesPrevias?: string;
  recomendaciones?: string;
  notas?: string;
  /** Diagnóstico de la consulta; se traspasa a la ficha de hospitalización. */
  diagnostico?: string;

  // --- Datos clínicos del momento (snapshot, no duplicados) ---
  // Estos SÍ tienen sentido guardarlos porque el paciente puede cambiar
  pesoActual?: number;
  /** Unidad del peso registrado en la consulta. Si falta, se interpreta como kg. */
  pesoActualUnit?: WeightUnit;
  edadAlMomento?: string; // string descriptivo opcional: "8 años 3 meses"
  /** Signos vitales registrados en la consulta; "normal" si se dejaron vacíos. */
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;

  // --- Metadata ---
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ❌ ELIMINADO:
// - propietario, paciente, raza, genero, tipoMascota → se obtienen del Patient/Owner vía ID
// - fecha "dd-mm-yyyy" → ahora es ISO
// - hora "10:30 AM" → ahora es 24h
