import { FileText, Pill, Sparkles } from "lucide-react";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#ece883]/25 bg-slate-900 shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-[#ece883] via-[#ece883]/60 to-transparent" />

        <div className="bg-gradient-to-br from-[#ece883]/10 via-slate-900 to-slate-900 p-6">
          <div className="flex items-start gap-4">
            <div className="relative p-3 rounded-2xl border border-[#ece883]/30 bg-[#ece883]/10 text-[#ece883]">
              <FileText className="h-6 w-6" />
              <Sparkles className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-[#ece883]" />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ece883]/70">
                Receta médica
              </p>
              <h3 className="text-lg font-bold text-white">
                ¿Realizar una receta?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Puedes agregar medicamentos con sus indicaciones y horarios para
                el paciente. La receta quedará asociada a esta consulta.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Medicamentos", "Dosis", "Indicaciones"].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-800 bg-slate-950/60 px-2 py-2.5 text-center text-[10px] font-semibold text-slate-400"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-800 bg-slate-950/40 p-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            No, finalizar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ece883] px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-[#ece883]/20 transition-colors hover:bg-[#f5f1a0]"
          >
            <Pill className="h-4 w-4" />
            Sí, crear receta
          </button>
        </div>
      </div>
    </div>
  );
};
