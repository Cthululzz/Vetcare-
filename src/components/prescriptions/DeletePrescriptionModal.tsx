import { AlertTriangle, Trash2 } from "lucide-react";
import type { Prescription } from "../../types/prescription";
import { formatDateTimeShort } from "../../utils/dateUtils";

interface DeletePrescriptionModalProps {
  prescription: Prescription;
  patientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación antes de eliminar una receta de forma definitiva. */
export const DeletePrescriptionModal = ({
  prescription,
  patientName,
  onConfirm,
  onCancel,
}: DeletePrescriptionModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-prescription-title"
      className="w-full max-w-sm space-y-4 rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center shadow-2xl"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/15 text-rose-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h2 id="delete-prescription-title" className="text-base font-bold text-white">
          Eliminar receta
        </h2>
        <p className="text-xs leading-relaxed text-slate-400">
          ¿Eliminar la receta de{" "}
          <span className="font-semibold text-slate-200">{patientName}</span>{" "}
          emitida el {formatDateTimeShort(prescription.createdAt)}? Esta acción
          no se puede deshacer.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-rose-400 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar receta
        </button>
      </div>
    </div>
  </div>
);
