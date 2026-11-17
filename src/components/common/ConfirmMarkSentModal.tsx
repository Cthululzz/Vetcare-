import { CheckCircle2, MessageCircle, X } from "lucide-react";
import { formatDateShort } from "../../utils/dateUtils";
import type { DueAppointmentReminder } from "../../utils/appointmentReminders";

interface ConfirmMarkSentModalProps {
  reminder: DueAppointmentReminder | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación antes de dar por enviado un recordatorio de cita. */
export const ConfirmMarkSentModal = ({
  reminder,
  onConfirm,
  onCancel,
}: ConfirmMarkSentModalProps) => {
  if (!reminder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-mark-sent-title"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="confirm-mark-sent-title"
                className="text-lg font-bold text-white"
              >
                ¿Marcar como enviado?
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta acción registrará el aviso como enviado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-300">
            ¿Estás seguro de marcar este recordatorio como enviado?
          </p>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-white">
              {reminder.patientName}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {reminder.ownerName} · {formatDateShort(reminder.appointment.fecha)} a
              las {reminder.appointment.hora} · Aviso{" "}
              {reminder.kind === "1h" ? "1 hora" : "24 horas"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            No, volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Sí, marcar enviado
          </button>
        </div>
      </div>
    </div>
  );
};
