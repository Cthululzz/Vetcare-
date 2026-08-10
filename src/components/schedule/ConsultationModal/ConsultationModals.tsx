// src/components/schedule/ConsultationModals.tsx
import { AlertTriangle } from "lucide-react";

interface ActionConfirmModalProps {
  show: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  borderColor?: string;
  iconBgColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmModal = ({
  show,
  title,
  description,
  confirmText,
  cancelText,
  borderColor = "border-amber-500/40",
  iconBgColor = "bg-amber-500/20 border-amber-500/40 text-amber-400",
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-sm bg-slate-900 border ${borderColor} rounded-2xl p-6 shadow-2xl space-y-4 text-center`}
      >
        <div
          className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${iconBgColor}`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
