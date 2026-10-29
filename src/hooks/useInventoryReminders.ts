import { useLocalStorage } from "./useLocalStorage";
import type { PendingInventoryReminder } from "../types/inventory";

const REMINDERS_KEY = "vet_inventory_reminders";

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

export function useInventoryReminders() {
  const [reminders, setReminders] = useLocalStorage<PendingInventoryReminder[]>(
    REMINDERS_KEY,
    [],
  );

  const getPendingReminders = (): PendingInventoryReminder[] => reminders;

  const createReminder = (
    movementId: string,
    userId: string,
  ): PendingInventoryReminder => {
    const newReminder: PendingInventoryReminder = {
      id: generateId(),
      movementId,
      userId,
      createdAt: isoNow(),
    };
    setReminders((prev) => [...prev, newReminder]);
    return newReminder;
  };

  const markAsNotified = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, lastNotifiedAt: isoNow() } : r)),
    );
  };

  const dismissReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const shouldNotify = (reminder: PendingInventoryReminder): boolean => {
    if (!reminder.lastNotifiedAt) return true;
    const lastNotified = new Date(reminder.lastNotifiedAt).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    return now - lastNotified >= thirtyMinutes;
  };

  const getRemindersToNotify = (): PendingInventoryReminder[] =>
    reminders.filter(shouldNotify);

  return {
    reminders,
    getPendingReminders,
    createReminder,
    markAsNotified,
    dismissReminder,
    shouldNotify,
    getRemindersToNotify,
  };
}
