import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteAppointmentModalProps {
  isOpen: boolean;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAppointmentModal = ({
  isOpen,
  patientName,
  appointmentDate,
  appointmentTime,
  onConfirm,
  onCancel,
}: DeleteAppointmentModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/30 bg-slate-900 shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-500/50 to-transparent" />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white">
                ¿Eliminar esta cita?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Se eliminará la cita de{" "}
                <strong className="text-white">{patientName}</strong> del{" "}
                <strong className="text-white">
                  {appointmentDate} a las {appointmentTime}
                </strong>
                . Esta acción no se puede deshacer.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancelar eliminación"
              className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
