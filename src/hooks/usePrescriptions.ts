import { useLocalStorage } from "./useLocalStorage";
import type {
  Prescription,
  PrescriptionMedication,
} from "../types/prescription";

const PRESCRIPTIONS_KEY = "vet_prescriptions";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useLocalStorage<Prescription[]>(
    PRESCRIPTIONS_KEY,
    [],
  );

  const createPrescription = (
    patientId: string,
    appointmentId: string,
    medications: PrescriptionMedication[],
    notes?: string,
  ): Prescription => {
    const newPrescription: Prescription = {
      id: generateId(),
      patientId,
      appointmentId,
      medications,
      notes,
      createdAt: isoNow(),
    };
    setPrescriptions((prev) => [newPrescription, ...prev]);
    return newPrescription;
  };

  const getPrescriptionsByPatient = (patientId: string): Prescription[] =>
    prescriptions.filter((p) => p.patientId === patientId);

  const getPrescriptionsByAppointment = (
    appointmentId: string,
  ): Prescription[] =>
    prescriptions.filter((p) => p.appointmentId === appointmentId);

  const getPrescription = (id: string): Prescription | undefined =>
    prescriptions.find((p) => p.id === id);

  const deletePrescription = (id: string) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    prescriptions,
    createPrescription,
    getPrescriptionsByPatient,
    getPrescriptionsByAppointment,
    getPrescription,
    deletePrescription,
  };
}
