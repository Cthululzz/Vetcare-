import { CheckCircle, X } from "lucide-react";
import type { Patient } from "../../types/patient";

interface DischargeConfirmModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DischargeConfirmModal = ({
  isOpen,
  patient,
  onConfirm,
  onCancel,
}: DischargeConfirmModalProps) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Dar de Alta al Paciente
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Confirmar alta médica
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 mb-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Paciente
              </p>
              <p className="text-base font-bold text-white">{patient.name}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/60">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">
                Esta acción:
              </p>
              <ul className="space-y-1.5 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Marcará la hospitalización como finalizada</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Registrará el alta en el historial clínico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>Liberará la cama asignada</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800/60">
              <p className="text-xs text-amber-400 font-medium">
                ⚠️ Asegúrate de que el paciente esté estable para el alta y de
                haber registrado toda la evolución necesaria.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar Alta
          </button>
        </div>
      </div>
    </div>
  );
};
