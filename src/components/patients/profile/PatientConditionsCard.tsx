import { useState, useEffect } from "react";
import { AlertTriangle, Edit2, Save } from "lucide-react";

interface PatientConditionsCardProps {
  conditions?: string;
  onSave: (newConditions: string) => void;
}

export const PatientConditionsCard = ({
  conditions,
  onSave,
}: PatientConditionsCardProps) => {
  const [isEditingConditions, setIsEditingConditions] = useState(false);
  const [condiciones, setCondiciones] = useState(conditions || "");

  // Sincronizar si cambian las condiciones desde fuera
  useEffect(() => {
    setCondiciones(conditions || "");
  }, [conditions]);

  const handleSave = () => {
    onSave(condiciones);
    setIsEditingConditions(false);
  };

  const handleCancel = () => {
    setCondiciones(conditions || "");
    setIsEditingConditions(false);
  };

  return (
    <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Condiciones Previas / Alergias Críticas</span>
        </div>
        {!isEditingConditions ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingConditions(true);
            }}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3" /> Editar
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-3 h-3" /> Guardar
            </button>
          </div>
        )}
      </div>

      {isEditingConditions ? (
        <textarea
          value={condiciones}
          onChange={(e) => setCondiciones(e.target.value)}
          rows={2}
          placeholder="Ej. Alérgico a la penicilina, condición cardíaca..."
          className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
        />
      ) : (
        <p className="text-xs text-slate-200 pl-6 leading-relaxed">
          {conditions ? (
            conditions
          ) : (
            <span className="text-slate-500 italic">
              Sin condiciones médicas registradas.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

export default PatientConditionsCard;
