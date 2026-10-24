import { Stethoscope, X } from "lucide-react";

interface ConsultationHeaderProps {
  tipoLabel: string; // ← antes era `tipo: string` (ID crudo)
  badgeStyle: string;
  onCloseClick: () => void;
}

export const ConsultationHeader = ({
  tipoLabel,
  badgeStyle,
  onCloseClick,
}: ConsultationHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Consulta Médica en Curso
          </h2>
          <p className="text-xs text-slate-400">
            Atención en curso para el paciente registrado.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`text-xs px-3 py-1 rounded-md border font-semibold w-fit ${badgeStyle}`}
        >
          {tipoLabel}
        </span>

        <button
          type="button"
          onClick={onCloseClick}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
