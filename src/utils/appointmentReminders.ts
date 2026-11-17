// ============================================
// RECORDATORIOS DE CITAS (24 h y 1 h antes)
// ============================================
// La app no envía mensajes sola: calcula qué avisos corresponden y deja
// que recepción abra WhatsApp. Los envíos quedan registrados en localStorage
// para no repetir el mismo aviso.

import type { Appointment } from "../types/appointment";
import type { Owner, Patient } from "../types/patient";
import type { AppointmentReminderKind } from "./whatsappUtils";

/** Horas antes de la cita en que corresponde cada aviso. */
export const REMINDER_WINDOWS: Record<AppointmentReminderKind, number> = {
  "24h": 24,
  "1h": 1,
};

export interface SentAppointmentReminder {
  id: string;
  appointmentId: string;
  kind: AppointmentReminderKind;
  sentAt: string; // ISO
}

export interface DueAppointmentReminder {
  appointment: Appointment;
  kind: AppointmentReminderKind;
  /** Fecha y hora de la cita como instante ISO. */
  appointmentAt: string;
  patientName: string;
  ownerName: string;
  ownerPhone: string;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Obtiene las citas cuyo instante se puede calcular (fecha + hora local).
 */
export const getAppointmentDateTime = (
  appointment: Appointment,
): Date | null => {
  if (!appointment.fecha || !appointment.hora) return null;
  const date = new Date(`${appointment.fecha}T${appointment.hora}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Devuelve el aviso que corresponde según cuánto falta para la cita.
 * Prioriza el de 1 hora cuando ya estamos dentro de esa ventana.
 */
const getDueKind = (
  appointmentAt: number,
  now: number,
): AppointmentReminderKind | null => {
  const remaining = appointmentAt - now;
  if (remaining <= 0) return null;
  if (remaining <= REMINDER_WINDOWS["1h"] * HOUR_MS) return "1h";
  if (remaining <= REMINDER_WINDOWS["24h"] * HOUR_MS) return "24h";
  return null;
};

/**
 * Excepción a la regla de "solo atender cuando llegue la hora": los avisos
 * de cita se envían antes (24 h o 1 h), así que activan el aviso de la
 * tarjeta aunque la cita todavía esté lejos. Solo aplica a recordatorios.
 */
export const hasDueAppointmentReminders = (
  reminders: DueAppointmentReminder[],
): boolean =>
  reminders.some(
    (reminder) => reminder.kind === "24h" || reminder.kind === "1h",
  );

/**
 * Recordatorios por enviar. Un mismo aviso no se repite si ya fue marcado.
 */
export const buildDueAppointmentReminders = (
  appointments: Appointment[],
  sentReminders: SentAppointmentReminder[],
  getPatient: (patientId: string) => Patient | undefined,
  getOwner: (ownerId: string) => Owner | undefined,
  now: number = Date.now(),
): DueAppointmentReminder[] => {
  const sentKeys = new Set(
    sentReminders.map((reminder) => `${reminder.appointmentId}:${reminder.kind}`),
  );
  const reminders: DueAppointmentReminder[] = [];

  for (const appointment of appointments) {
    if (appointment.status !== "programada") continue;

    const date = getAppointmentDateTime(appointment);
    if (!date) continue;

    const appointmentAt = date.getTime();
    const kind = getDueKind(appointmentAt, now);
    if (!kind) continue;
    if (sentKeys.has(`${appointment.id}:${kind}`)) continue;

    const patient = getPatient(appointment.patientId);
    const owner = patient ? getOwner(patient.ownerId) : undefined;
    if (!patient) continue;

    reminders.push({
      appointment,
      kind,
      appointmentAt: date.toISOString(),
      patientName: patient.name,
      ownerName: owner?.name ?? "Propietario",
      ownerPhone: owner?.phone ?? "",
    });
  }

  return reminders.sort((a, b) =>
    a.appointmentAt.localeCompare(b.appointmentAt),
  );
};
