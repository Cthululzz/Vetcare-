import { useMemo } from "react";
import type { Appointment } from "../types/appointment";
import type { EstadoCita } from "../constants/appConstants";
import { useLocalStorage } from "./useLocalStorage";
import {
  getLocalTodayStr,
  sortAppointmentsByDateTime,
} from "../utils/dateUtils";

// ============================================
// CONSTANTES
// ============================================
const APPOINTMENTS_KEY = "vet_appointments";

// Estados que indican que la cita ya terminó
const ESTADOS_FINALIZADOS: EstadoCita[] = ["finalizada", "cancelada"];

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
export function useAppointments() {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>(
    APPOINTMENTS_KEY,
    [],
  );

  // ---------- CRUD ----------

  const getAppointment = (id: string): Appointment | undefined =>
    appointments.find((app) => app.id === id);

  const getAppointmentsByPatient = (patientId: string): Appointment[] =>
    appointments.filter((app) => app.patientId === patientId);

  const getAppointmentsByDoctor = (doctorId: string): Appointment[] =>
    appointments.filter((app) => app.doctorId === doctorId);

  const getAppointmentsByDate = (fecha: string): Appointment[] =>
    appointments.filter((app) => app.fecha === fecha);

  const createAppointment = (
    data: Omit<Appointment, "id" | "createdAt" | "updatedAt">,
  ): Appointment => {
    const newAppointment: Appointment = {
      ...data,
      id: generateId(),
      createdAt: isoNow(),
      updatedAt: isoNow(),
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return newAppointment;
  };

  const updateAppointment = (
    id: string,
    updates: Partial<Omit<Appointment, "id" | "createdAt">>,
  ) => {
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, ...updates, updatedAt: isoNow() } : app,
      ),
    );
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((app) => app.id !== id));
  };

  const updateStatus = (id: string, status: EstadoCita) => {
    updateAppointment(id, { status });
  };

  // ---------- CONSULTAS DERIVADAS (memoizadas) ----------

  const todayIso = getLocalTodayStr();

  const citasDeHoy = useMemo(
    () =>
      sortAppointmentsByDateTime(
        appointments.filter(
          (app) =>
            app.fecha === todayIso && !ESTADOS_FINALIZADOS.includes(app.status),
        ),
      ),
    [appointments, todayIso],
  );

  const proximoPaciente = useMemo(() => citasDeHoy[0] || null, [citasDeHoy]);

  const totalCitasHoy = citasDeHoy.length;

  // ---------- LÓGICA DE NEGOCIO ----------

  /**
   * Verifica si un paciente es primera vez (tiene 0 o 1 citas previas)
   */
  const isFirstTimePatient = (patientId: string): boolean => {
    const historialPaciente = appointments.filter(
      (app) => app.patientId === patientId,
    );
    return historialPaciente.length <= 1;
  };

  /**
   * Busca conflictos de horario para un doctor en una fecha/hora específica
   */
  const hasScheduleConflict = (
    doctorId: string,
    fecha: string,
    hora: string,
    excludeAppointmentId?: string,
  ): boolean => {
    return appointments.some(
      (app) =>
        app.id !== excludeAppointmentId &&
        app.doctorId === doctorId &&
        app.fecha === fecha &&
        app.hora === hora &&
        !ESTADOS_FINALIZADOS.includes(app.status),
    );
  };

  return {
    // Datos crudos
    appointments,

    // Consultas
    getAppointment,
    getAppointmentsByPatient,
    getAppointmentsByDoctor,
    getAppointmentsByDate,

    // CRUD
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,

    // Derivados
    citasDeHoy,
    proximoPaciente,
    totalCitasHoy,

    // Lógica de negocio
    isFirstTimePatient,
    hasScheduleConflict,
  };
}
