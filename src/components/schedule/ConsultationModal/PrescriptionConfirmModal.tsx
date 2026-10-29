import { FileText } from "lucide-react";

interface PrescriptionConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PrescriptionConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
}: PrescriptionConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">
              ¿Realizar una receta?
            </h3>
            <p className="text-sm text-slate-400">
              Puedes agregar medicamentos con sus indicaciones y horarios para
              el paciente.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
};
