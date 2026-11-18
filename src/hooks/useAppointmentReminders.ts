import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useBranchScope } from "../context/branchScope";
import type { AppointmentReminderKind } from "../utils/whatsappUtils";
import type { SentAppointmentReminder } from "../utils/appointmentReminders";
import type { BranchScoped } from "../types/organization";

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
  const { filterByScope } = useBranchScope();
  const [storedReminders, setSentReminders] = useLocalStorage<
    SentAppointmentReminder[]
  >(APPOINTMENT_REMINDERS_KEY, []);
  const sentReminders = useMemo(
    () => filterByScope(storedReminders),
    [filterByScope, storedReminders],
  );

  const markAsSent = (
    appointmentId: string,
    kind: AppointmentReminderKind,
    scope: BranchScoped,
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
          ...scope,
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
