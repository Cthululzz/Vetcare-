import { useState } from "react";
import {
  Stethoscope,
  FileText,
  Calendar,
  Weight,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import type { MedicalRecord } from "../../../types/patient";
import { getRecordType } from "../../../utils/clinicalHistory";
import { RECORD_TYPE_META } from "../history/recordTypeMeta";
import { ExamOrderSummary } from "../history/ExamOrderSummary";
import { PrintClinicalRecordButton } from "../../print/PrintClinicalRecordButton";
import { formatWeightWithUnit } from "../../../utils/weight";

interface PatientClinicalHistoryProps {
  history: MedicalRecord[];
  onDeleteMedicalRecord?: (recordId: string) => void;
  onOpenFullHistory?: () => void;
  isReadOnly?: boolean;
}

export const PatientClinicalHistory = ({
  history = [],
  onDeleteMedicalRecord,
  onOpenFullHistory,
  isReadOnly = false,
}: PatientClinicalHistoryProps) => {
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Ordenar por fecha descendente (más reciente primero)
  const sortedHistory = [...history].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );

  const latestConsultation = sortedHistory.length > 0 ? sortedHistory[0] : null;
  const pastHistory = sortedHistory.length > 1 ? sortedHistory.slice(1) : [];

  const handleDelete = (recordId: string) => {
    if (isReadOnly || !onDeleteMedicalRecord) return;
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este registro clínico?",
      )
    ) {
      onDeleteMedicalRecord(recordId);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const partes = (dateStr ?? "").split("T")[0].split("-");
    if (partes.length !== 3) return "Fecha no disponible";
    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
  };

  const renderVitalSigns = (record: MedicalRecord) => {
    const signs = [
      record.temperature && `🌡️ Temp: ${record.temperature}`,
      record.heartRate && `❤️ FC: ${record.heartRate}`,
      record.respiratoryRate && `🫁 FR: ${record.respiratoryRate}`,
    ].filter(Boolean);

    if (signs.length === 0) return null;

    return (
      <p className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
        <span className="font-bold uppercase tracking-wider text-slate-500">
          Signos vitales:
        </span>
        {signs.map((sign) => (
          <span key={sign as string}>{sign}</span>
        ))}
      </p>
    );
  };

  const renderTypeBadge = (record: MedicalRecord) => {
    const meta = RECORD_TYPE_META[getRecordType(record)];
    const Icon = meta.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.badgeClass}`}
      >
        <Icon className="w-3 h-3" />
        {meta.label}
      </span>
    );
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

      {onOpenFullHistory && (
        <button
          type="button"
          onClick={onOpenFullHistory}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-[#ece883]/40 text-xs font-bold text-[#ece883] transition-colors cursor-pointer"
        >
          <History className="w-4 h-4" />
          Ver historial clínico completo
        </button>
      )}

      {sortedHistory.length === 0 ? (
        <div className="bg-slate-950/30 border border-slate-800/60 rounded-2xl p-10 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
          <p className="text-sm font-medium text-slate-400">
            Aún no hay registros clínicos para este paciente.
          </p>
          <p className="text-xs text-slate-500">
            Las consultas aparecerán aquí automáticamente al finalizarlas desde
            la agenda. También puedes agregar vacunas, exámenes y notas desde el
            historial clínico completo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ÚLTIMA CONSULTA */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Último registro
              </p>
              {latestConsultation && onDeleteMedicalRecord && (
                <button
                  type="button"
                  onClick={() => handleDelete(latestConsultation.id)}
                  disabled={isReadOnly}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-200">
                    <Calendar className="w-4 h-4 text-[#ece883]" />
                    <span>{formatDateDisplay(latestConsultation.date)}</span>
                    {renderTypeBadge(latestConsultation)}
                    <PrintClinicalRecordButton record={latestConsultation} />
                  </div>
                  {latestConsultation.weight ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-[#ece883]">
                      <Weight className="w-3.5 h-3.5" />
                      <span>
                        {formatWeightWithUnit(
                          latestConsultation.weight,
                          latestConsultation.weightUnit,
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400">
                      <Weight className="w-3.5 h-3.5 text-slate-500" />
                      <span>No registrado</span>
                    </div>
                  )}
                </div>

                {latestConsultation.diagnosis && (
                  <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Diagnóstico:
                    </span>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {latestConsultation.diagnosis}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Notas de consulta:
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

                <ExamOrderSummary
                  order={latestConsultation.examOrder}
                  compact
                />

                {renderVitalSigns(latestConsultation)}
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
                <span>Ver registros anteriores ({pastHistory.length})</span>
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
                          {renderTypeBadge(entry)}
                        </div>

                        <div className="flex items-center gap-3">
                          {entry.weight ? (
                            <span className="text-xs font-semibold text-slate-300">
                              ⚖️{" "}
                              {formatWeightWithUnit(
                                entry.weight,
                                entry.weightUnit,
                              )}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              ⚖️ No registrado
                            </span>
                          )}

                          {onDeleteMedicalRecord && (
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              disabled={isReadOnly}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                              title="Eliminar este registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {entry.diagnosis && (
                        <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                            Diagnóstico:
                          </span>
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {entry.diagnosis}
                          </p>
                        </div>
                      )}

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

                      <ExamOrderSummary order={entry.examOrder} compact />

                      {renderVitalSigns(entry)}
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
