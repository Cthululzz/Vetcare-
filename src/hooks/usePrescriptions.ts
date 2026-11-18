import { useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useBranchScope } from "../context/branchScope";
import type {
  Prescription,
  PrescriptionMedication,
} from "../types/prescription";
import type { BranchScoped } from "../types/organization";

const PRESCRIPTIONS_KEY = "vet_prescriptions";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function usePrescriptions() {
  const { filterByScope, writeScope } = useBranchScope();
  const [storedPrescriptions, setPrescriptions] = useLocalStorage<Prescription[]>(
    PRESCRIPTIONS_KEY,
    [],
  );
  const prescriptions = useMemo(
    () => filterByScope(storedPrescriptions),
    [filterByScope, storedPrescriptions],
  );

  const createPrescription = (
    patientId: string,
    appointmentId: string,
    medications: PrescriptionMedication[],
    notes?: string,
    scope?: BranchScoped,
  ): Prescription => {
    const newPrescription: Prescription = {
      ...(scope ?? writeScope()),
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
