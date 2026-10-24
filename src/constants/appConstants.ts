// ============================================
// CONSTANTES GLOBALES DE LA APLICACIÓN
// ============================================

// --- Configuración general ---
export const APP_CONFIG = {
  appName: "VetFlow Manager",
  version: "1.0.0",
} as const;

// --- Roles de usuario ---
export const ROLES_USUARIO = {
  ADMIN: "Administrador",
  VET: "Médico Veterinario",
  RECEPTIONIST: "Recepcionista",
  INVENTORY: "Encargado de Inventario",
} as const;
export type UserRole = keyof typeof ROLES_USUARIO;

// --- Sucursales ---
export const SUCURSALES = [
  { id: "centro", name: "Sucursal Central (Providencia)" },
  { id: "norte", name: "Sucursal Norte (Las Condes)" },
  { id: "sur", name: "Sucursal Sur (Ñuñoa)" },
] as const;
export type SucursalId = (typeof SUCURSALES)[number]["id"];

// --- Doctores ---
export const DOCTORES = [
  { id: "silva", name: "Dr. Silva" },
  { id: "gomez", name: "Dra. Gómez" },
  { id: "morales", name: "Dr. Morales" },
] as const;
export type DoctorId = (typeof DOCTORES)[number]["id"];

// --- Especies ---
export const ESPECIES_MASCOTA = [
  "perro",
  "gato",
  "exoticos", // ← representa "Exóticos / Otros"
] as const;
export type EspecieMascota = (typeof ESPECIES_MASCOTA)[number];

// --- Tipos de cita ---
export const TIPOS_CITA = [
  { value: "control", label: "Control General" },
  { value: "vacuna", label: "Vacunación" },
  { value: "desparasitacion", label: "Desparasitación" },
  { value: "esterilizacion", label: "Esterilización / Cirugía" },
  { value: "urgencia", label: "Urgencia Médica" },
] as const;
export type TipoCita = (typeof TIPOS_CITA)[number]["value"];

// --- Estados de vacunación ---
export const ESTADOS_VACUNA = ["al_dia", "pendiente", "atrasada"] as const;
export type EstadoVacuna = (typeof ESTADOS_VACUNA)[number];

// --- Géneros ---
export const GENEROS = ["macho", "hembra"] as const;
export type Genero = (typeof GENEROS)[number];

// --- Estados de cita ---
export const ESTADOS_CITA = [
  "programada",
  "en_consulta",
  "finalizada",
  "cancelada",
] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

// ============================================
// HELPERS PARA RESOLVER IDS A LABELS
// ============================================

/**
 * Obtiene el nombre legible de un doctor a partir de su ID
 */
export const getDoctorName = (doctorId: DoctorId | string): string => {
  const doctor = DOCTORES.find((d) => d.id === doctorId);
  return doctor?.name || doctorId;
};

/**
 * Obtiene el nombre legible de una sucursal a partir de su ID
 */
export const getSucursalName = (sucursalId: SucursalId | string): string => {
  const sucursal = SUCURSALES.find((s) => s.id === sucursalId);
  return sucursal?.name || sucursalId;
};

/**
 * Obtiene el label legible de un tipo de cita
 */
export const getTipoCitaLabel = (tipo: TipoCita | string): string => {
  const tipoCita = TIPOS_CITA.find((t) => t.value === tipo);
  return tipoCita?.label || tipo;
};

/**
 * Obtiene el label legible del estado de una cita
 */
export const getEstadoCitaLabel = (estado: EstadoCita | string): string => {
  const labels: Record<EstadoCita, string> = {
    programada: "Programada",
    en_consulta: "En Consulta",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
  };
  return labels[estado as EstadoCita] || estado;
};

/**
 * Obtiene el label legible de una especie
 */
export const getEspecieLabel = (especie: EspecieMascota | string): string => {
  const labels: Record<EspecieMascota, string> = {
    perro: "Perro",
    gato: "Gato",
    exoticos: "Exóticos / Otros",
  };
  return labels[especie as EspecieMascota] || especie;
};

/**
 * Obtiene el label legible del género
 */
export const getGeneroLabel = (genero: Genero | string): string => {
  const labels: Record<Genero, string> = {
    macho: "Macho",
    hembra: "Hembra",
  };
  return labels[genero as Genero] || genero;
};
