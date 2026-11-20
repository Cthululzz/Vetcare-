import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useBranchScope } from "../context/branchScope";
import type { Patient, Owner, MedicalRecord } from "../types/patient";
import type {
  BranchScoped,
  VinculoSucursal,
} from "../types/organization";
import type {
  EspecieMascota,
  Genero,
  EstadoVacuna,
  SucursalId,
} from "../constants/appConstants";
import { normalizePhone } from "../utils/phone";
import {
  findClientMatches,
  type ClientMatch,
  type ClientMatchInput,
} from "../utils/clientMatching";

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

function agregarVinculo(
  actuales: VinculoSucursal[] | undefined,
  vinculo: VinculoSucursal,
): VinculoSucursal[] {
  const lista = actuales ?? [];
  const indice = lista.findIndex(
    (item) =>
      item.sucursalId === vinculo.sucursalId &&
      item.motivo === vinculo.motivo &&
      (item.citaId ?? "") === (vinculo.citaId ?? ""),
  );
  if (indice === -1) return [...lista, vinculo];
  return lista.map((item, i) =>
    i === indice ? { ...item, activo: true } : item,
  );
}

function transformarVinculos(
  actuales: VinculoSucursal[] | undefined,
  transformar: (vinculo: VinculoSucursal) => VinculoSucursal,
): VinculoSucursal[] | undefined {
  return actuales?.map(transformar);
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function usePatients() {
  const { filterByScope, writeScope } = useBranchScope();
  const [storedPatients, setPatients] = useLocalStorage<Patient[]>(
    PATIENTS_KEY,
    [],
  );
  const [storedOwners, setOwners] = useLocalStorage<Owner[]>(OWNERS_KEY, []);

  const patients = useMemo(
    () => filterByScope(storedPatients),
    [filterByScope, storedPatients],
  );
  const owners = useMemo(
    () => filterByScope(storedOwners),
    [filterByScope, storedOwners],
  );

  // ---------- OWNERS ----------

  const getOwner = (ownerId: string): Owner | undefined =>
    owners.find((o) => o.id === ownerId);

  const getOwnerByPhone = (phone: string): Owner | undefined => {
    const normalizado = normalizePhone(phone);
    if (!normalizado) return undefined;
    return owners.find((o) => normalizePhone(o.phone) === normalizado);
  };

  /** Dueño por ID sin aplicar el filtro de sucursal. */
  const getOwnerEnTodasSedes = (ownerId: string): Owner | undefined =>
    storedOwners.find((o) => o.id === ownerId);

  /** Coincidencias en todas las sucursales, para ofrecer la vinculación. */
  const findCoincidenciasClientes = (
    input: ClientMatchInput,
  ): ClientMatch[] => findClientMatches(storedOwners, storedPatients, input);

  /**
   * Agrega una sucursal a la ficha del dueño y a todas sus mascotas. El mismo
   * vínculo se replica para que el filtro por sucursal vea al paciente y a su
   * tutor como una sola unidad.
   */
  const vincularSucursal = (
    ownerId: string,
    sucursalId: SucursalId,
    opciones: {
      motivo: VinculoSucursal["motivo"];
      citaId?: string;
      creadoPor?: string;
      confirmadoEn?: string;
    },
  ) => {
    const vinculo: VinculoSucursal = {
      sucursalId,
      motivo: opciones.motivo,
      citaId: opciones.citaId,
      creadoEn: isoNow(),
      creadoPor: opciones.creadoPor,
      confirmadoEn: opciones.confirmadoEn,
      activo: true,
    };

    setOwners((prev) =>
      prev.map((o) =>
        o.id === ownerId
          ? { ...o, sucursalesAcceso: agregarVinculo(o.sucursalesAcceso, vinculo) }
          : o,
      ),
    );
    setPatients((prev) =>
      prev.map((p) =>
        p.ownerId === ownerId
          ? {
              ...p,
              sucursalesAcceso: agregarVinculo(p.sucursalesAcceso, vinculo),
              updatedAt: isoNow(),
            }
          : p,
      ),
    );
  };

  /** Marca el vínculo de una cita como confirmado tras una atención real. */
  const confirmarVinculosCita = (citaId: string) => {
    const fecha = isoNow();
    const transformar = (vinculo: VinculoSucursal): VinculoSucursal =>
      vinculo.citaId === citaId
        ? { ...vinculo, confirmadoEn: vinculo.confirmadoEn ?? fecha }
        : vinculo;

    setOwners((prev) =>
      prev.map((o) => ({
        ...o,
        sucursalesAcceso: transformarVinculos(o.sucursalesAcceso, transformar),
      })),
    );
    setPatients((prev) =>
      prev.map((p) => ({
        ...p,
        sucursalesAcceso: transformarVinculos(p.sucursalesAcceso, transformar),
      })),
    );
  };

  /** Deshace el vínculo de una cita que se eliminó sin llegar a atender. */
  const desactivarVinculoCita = (
    ownerId: string,
    citaId: string,
    sucursalId: SucursalId,
  ) => {
    const transformar = (vinculo: VinculoSucursal): VinculoSucursal =>
      vinculo.citaId === citaId && vinculo.sucursalId === sucursalId
        ? { ...vinculo, activo: false }
        : vinculo;

    setOwners((prev) =>
      prev.map((o) =>
        o.id === ownerId
          ? {
              ...o,
              sucursalesAcceso: transformarVinculos(
                o.sucursalesAcceso,
                transformar,
              ),
            }
          : o,
      ),
    );
    setPatients((prev) =>
      prev.map((p) =>
        p.ownerId === ownerId
          ? {
              ...p,
              sucursalesAcceso: transformarVinculos(
                p.sucursalesAcceso,
                transformar,
              ),
            }
          : p,
      ),
    );
  };

  /**
   * Dueño asociado a una cita. El NOMBRE es la clave: si no coincide con ningún
   * cliente registrado no se devuelve nadie, aunque el teléfono pertenezca a
   * otro dueño. El teléfono sólo desempata cuando hay dos clientes con el mismo
   * nombre. Así, al escribir un nombre nuevo el formulario vuelve a cero.
   */
  const getOwnerForAppointment = (
    phone: string,
    name: string,
  ): Owner | undefined => {
    const nombre = name.trim().toLowerCase();
    if (!nombre) return undefined;

    const porNombre = owners.filter(
      (o) => o.name.trim().toLowerCase() === nombre,
    );
    if (porNombre.length === 0) return undefined;
    if (porNombre.length === 1) return porNombre[0];

    const normalizado = normalizePhone(phone);
    if (!normalizado) return undefined;
    return porNombre.find((o) => normalizePhone(o.phone) === normalizado);
  };

  const createOwner = (
    data: Omit<Owner, "id" | "createdAt" | "organizationId" | "sucursalId">,
    scope?: BranchScoped,
  ): Owner => {
    const newOwner: Owner = {
      ...data,
      ...(scope ?? writeScope()),
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

  /** Búsqueda sin filtro de sucursal, para integridad de camas e internaciones. */
  const getPatientEnTodasSedes = (patientId: string): Patient | undefined =>
    storedPatients.find((p) => p.id === patientId);

  const getPatientsByOwner = (ownerId: string): Patient[] =>
    patients.filter((p) => p.ownerId === ownerId);

  /** Mascotas de un dueño sin aplicar el filtro de sucursal. */
  const getPatientsByOwnerEnTodasSedes = (ownerId: string): Patient[] =>
    storedPatients.filter((p) => p.ownerId === ownerId);

  const createPatient = (
    data: Omit<
      Patient,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "history"
      | "isActive"
      | "organizationId"
      | "sucursalId"
    >,
  ): Patient => {
    const owner = storedOwners.find((o) => o.id === data.ownerId);
    const scope: BranchScoped = owner
      ? {
          organizationId: owner.organizationId,
          sucursalId: owner.sucursalId,
          ...(owner.sucursalesAcceso
            ? { sucursalesAcceso: owner.sucursalesAcceso }
            : {}),
        }
      : writeScope();
    const newPatient: Patient = {
      ...data,
      ...scope,
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
    record: Omit<MedicalRecord, "id" | "organizationId" | "sucursalId">,
    scope?: BranchScoped,
  ) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;

        const recordScope = scope ?? {
          organizationId: p.organizationId,
          sucursalId: p.sucursalId,
        };
        const newRecord: MedicalRecord = {
          ...record,
          ...recordScope,
          id: generateId(),
        };
        return {
          ...p,
          history: [newRecord, ...p.history],
          updatedAt: isoNow(),
        };
      }),
    );
  };

  const updateMedicalRecord = (
    patientId: string,
    recordId: string,
    updates: Partial<Omit<MedicalRecord, "id">>,
  ) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              history: p.history.map((record) =>
                record.id === recordId ? { ...record, ...updates } : record,
              ),
              updatedAt: isoNow(),
            }
          : p,
      ),
    );
  };

  const deleteMedicalRecord = (patientId: string, recordId: string) => {    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              history: p.history.filter((record) => record.id !== recordId),
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
    record: Omit<MedicalRecord, "id" | "organizationId" | "sucursalId">;
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
    getOwnerEnTodasSedes,
    getOwnerForAppointment,
    findCoincidenciasClientes,
    vincularSucursal,
    confirmarVinculosCita,
    desactivarVinculoCita,
    createOwner,
    updateOwner,
    deleteOwner,

    // Patients
    getPatient,
    getPatientEnTodasSedes,
    getPatientsByOwner,
    getPatientsByOwnerEnTodasSedes,
    getActivePatients,
    getHospitalizedPatients,
    createPatient,
    updatePatient,
    deletePatient,
    hardDeletePatient,

    // Historial
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,

    // Consulta (lógica compuesta)
    registerFromConsultation,
    updateConditions,
  };
}
