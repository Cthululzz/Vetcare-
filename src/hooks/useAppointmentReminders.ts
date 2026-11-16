import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { AppointmentReminderKind } from "../utils/whatsappUtils";
import type { SentAppointmentReminder } from "../utils/appointmentReminders";

const APPOINTMENT_REMINDERS_KEY = "vet_appointment_reminders";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

/**
 * Registro de recordatorios de cita ya enviados (o marcados como enviados).
 * El cálculo de cuáles corresponden vive en `utils/appointmentReminders.ts`.
 */
export function useAppointmentReminders() {
  const [sentReminders, setSentReminders] = useLocalStorage<
    SentAppointmentReminder[]
  >(APPOINTMENT_REMINDERS_KEY, []);

  const markAsSent = (
    appointmentId: string,
    kind: AppointmentReminderKind,
  ): void => {
    setSentReminders((prev) => {
      const alreadySent = prev.some(
        (reminder) =>
          reminder.appointmentId === appointmentId && reminder.kind === kind,
      );
      if (alreadySent) return prev;

      return [
        ...prev,
        {
          id: generateId(),
          appointmentId,
          kind,
          sentAt: isoNow(),
        },
      ];
    });
  };

  const isSent = useCallback(
    (appointmentId: string, kind: AppointmentReminderKind): boolean =>
      sentReminders.some(
        (reminder) =>
          reminder.appointmentId === appointmentId && reminder.kind === kind,
      ),
    [sentReminders],
  );

  return {
    sentReminders,
    markAsSent,
    isSent,
  };
}
