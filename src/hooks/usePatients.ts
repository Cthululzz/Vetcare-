import { useLocalStorage } from "./useLocalStorage";
import type { Patient, Owner, MedicalRecord } from "../types/patient";
import type {
  EspecieMascota,
  Genero,
  EstadoVacuna,
} from "../constants/appConstants";

// ============================================
// KEYS DE ALMACENAMIENTO
// ============================================
const PATIENTS_KEY = "vet_patients";
const OWNERS_KEY = "vet_owners";

// ============================================
// UTILIDADES INTERNAS
// ============================================
function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function usePatients() {
  const [patients, setPatients] = useLocalStorage<Patient[]>(PATIENTS_KEY, []);
  const [owners, setOwners] = useLocalStorage<Owner[]>(OWNERS_KEY, []);

  // ---------- OWNERS ----------

  const getOwner = (ownerId: string): Owner | undefined =>
    owners.find((o) => o.id === ownerId);

  const getOwnerByPhone = (phone: string): Owner | undefined =>
    owners.find((o) => o.phone === phone);

  const createOwner = (data: Omit<Owner, "id" | "createdAt">): Owner => {
    const newOwner: Owner = {
      ...data,
      id: generateId(),
      createdAt: isoNow(),
    };
    setOwners((prev) => [...prev, newOwner]);
    return newOwner;
  };

  const updateOwner = (
    id: string,
    updates: Partial<Omit<Owner, "id" | "createdAt">>,
  ) => {
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  };

  const deleteOwner = (id: string) => {
    setOwners((prev) => prev.filter((o) => o.id !== id));
    // Opcional: eliminar también sus mascotas
    setPatients((prev) => prev.filter((p) => p.ownerId !== id));
  };

  // ---------- PATIENTS ----------

  const getPatient = (patientId: string): Patient | undefined =>
    patients.find((p) => p.id === patientId);

  const getPatientsByOwner = (ownerId: string): Patient[] =>
    patients.filter((p) => p.ownerId === ownerId);

  const createPatient = (
    data: Omit<
      Patient,
      "id" | "createdAt" | "updatedAt" | "history" | "isActive"
    >,
  ): Patient => {
    const newPatient: Patient = {
      ...data,
      id: generateId(),
      history: [],
      isActive: true,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = (
    id: string,
    updates: Partial<Omit<Patient, "id" | "createdAt">>,
  ) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: isoNow() } : p,
      ),
    );
  };

  const deletePatient = (id: string) => {
    // Soft delete: marcamos como inactivo en lugar de borrar
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isActive: false, updatedAt: isoNow() } : p,
      ),
    );
  };

  const hardDeletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  // ---------- HISTORIAL MÉDICO ----------

  const addMedicalRecord = (
    patientId: string,
    record: Omit<MedicalRecord, "id">,
  ) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: generateId(),
    };
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              history: [newRecord, ...p.history],
              updatedAt: isoNow(),
            }
          : p,
      ),
    );
  };

  // ---------- CONSULTA (lógica de negocio compuesta) ----------
  // Esta función orquesta: crear/obtener dueño + crear/actualizar paciente + agregar historial
  const registerFromConsultation = (params: {
    ownerName: string;
    ownerPhone: string;
    ownerEmail?: string;
    patientName: string;
    species: EspecieMascota;
    gender: Genero;
    breed?: string;
    birthDate?: string;
    microchip?: string;
    vaccineStatus: EstadoVacuna;
    record: Omit<MedicalRecord, "id">;
  }): { patient: Patient; owner: Owner } => {
    // 1. Buscar o crear dueño
    let owner = getOwnerByPhone(params.ownerPhone);
    if (!owner) {
      owner = createOwner({
        name: params.ownerName,
        phone: params.ownerPhone,
        email: params.ownerEmail,
      });
    }

    // 2. Buscar paciente existente (por nombre + dueño) o crear nuevo
    let patient = patients.find(
      (p) =>
        p.name.toLowerCase() === params.patientName.toLowerCase() &&
        p.ownerId === owner!.id &&
        p.isActive,
    );

    if (!patient) {
      patient = createPatient({
        name: params.patientName,
        species: params.species,
        gender: params.gender,
        ownerId: owner.id,
        breed: params.breed,
        birthDate: params.birthDate,
        microchip: params.microchip,
        vaccineStatus: params.vaccineStatus,
      });
    }

    // 3. Agregar registro médico
    addMedicalRecord(patient.id, params.record);

    // Devolvemos el paciente actualizado
    const updatedPatient = getPatient(patient.id)!;
    return { patient: updatedPatient, owner };
  };

  // ---------- DERIVADOS (datos calculados, no almacenados) ----------

  const getActivePatients = (): Patient[] => patients.filter((p) => p.isActive);

  const getHospitalizedPatients = (): Patient[] =>
    // Esto debería basarse en citas activas de tipo hospitalización,
    // pero por ahora lo dejamos como filtro simple
    patients.filter(
      (p) =>
        p.isActive &&
        p.history.some((r) =>
          r.recommendations?.toLowerCase().includes("hospitalizado"),
        ),
    );
  const updateConditions = (patientId: string, conditions: string) => {
    updatePatient(patientId, { conditions });
  };

  return {
    // Datos crudos
    patients,
    owners,

    // Owners
    getOwner,
    getOwnerByPhone,
    createOwner,
    updateOwner,
    deleteOwner,

    // Patients
    getPatient,
    getPatientsByOwner,
    getActivePatients,
    getHospitalizedPatients,
    createPatient,
    updatePatient,
    deletePatient,
    hardDeletePatient,

    // Historial
    addMedicalRecord,

    // Consulta (lógica compuesta)
    registerFromConsultation,
    updateConditions,
  };
}
