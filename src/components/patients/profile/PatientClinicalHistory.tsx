import { useState } from "react";
import {
  Stethoscope,
  FileText,
  Calendar,
  Weight,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { MedicalRecord } from "../../../types/patient";
import { formatDateShort } from "../../../utils/dateUtils";

interface PatientClinicalHistoryProps {
  history: MedicalRecord[];
  onDeleteMedicalRecord: (recordId: string) => void;
}

export const PatientClinicalHistory = ({
  history = [],
  onDeleteMedicalRecord,
}: PatientClinicalHistoryProps) => {
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Ordenar por fecha descendente (más reciente primero)
  const sortedHistory = [...history].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const latestConsultation = sortedHistory.length > 0 ? sortedHistory[0] : null;
  const pastHistory = sortedHistory.length > 1 ? sortedHistory.slice(1) : [];

  const handleDelete = (recordId: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este registro clínico?",
      )
    ) {
      onDeleteMedicalRecord(recordId);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-[#ece883]" />
          Historial Clínico
        </h3>
        <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {sortedHistory.length}{" "}
          {sortedHistory.length === 1 ? "registro total" : "registros totales"}
        </span>
      </div>

      {sortedHistory.length === 0 ? (
        <div className="bg-slate-950/30 border border-slate-800/60 rounded-2xl p-10 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
          <p className="text-sm font-medium text-slate-400">
            Aún no hay consultas finalizadas registradas para este paciente.
          </p>
          <p className="text-xs text-slate-500">
            Las notas aparecerán aquí automáticamente en cuanto finalices una
            consulta desde la agenda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ÚLTIMA CONSULTA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Última Consulta Registrada
              </p>
              {latestConsultation && (
                <button
                  type="button"
                  onClick={() => handleDelete(latestConsultation.id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                  title="Eliminar este registro erróneo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar registro</span>
                </button>
              )}
            </div>

            {latestConsultation && (
              <div className="bg-slate-950/70 border border-[#ece883]/30 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ece883]/5 rounded-bl-full pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Calendar className="w-4 h-4 text-[#ece883]" />
                    <span>{formatDateDisplay(latestConsultation.date)}</span>
                  </div>
                  {latestConsultation.weight ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-[#ece883]">
                      <Weight className="w-3.5 h-3.5" />
                      <span>{latestConsultation.weight} kg</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400">
                      <Weight className="w-3.5 h-3.5 text-slate-500" />
                      <span>No registrado kg</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Notas Clínicas / Diagnóstico:
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {latestConsultation.notes || "Sin notas registradas."}
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Tratamiento / Recomendaciones:
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {latestConsultation.recommendations ||
                        "Sin recomendaciones adicionales."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENÚ ACORDEÓN PARA HISTORIAL ANTERIOR */}
          {pastHistory.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs font-bold text-[#ece883] transition-colors cursor-pointer"
              >
                <span>Ver consultas anteriores ({pastHistory.length})</span>
                {showFullHistory ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showFullHistory && (
                <div className="space-y-3 mt-3 animate-fadeIn">
                  {pastHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateDisplay(entry.date)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {entry.weight ? (
                            <span className="text-xs font-semibold text-slate-300">
                              ⚖️ {entry.weight} kg
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              ⚖️ No registrado kg
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Notas:
                          </span>
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {entry.notes || "Sin notas registradas."}
                          </p>
                        </div>

                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Recomendaciones:
                          </span>
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {entry.recommendations ||
                              "Sin recomendaciones adicionales."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientClinicalHistory;
