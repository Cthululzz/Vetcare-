import {
  Activity,
  Calendar,
  CalendarClock,
  Pencil,
  Stethoscope,
  Trash2,
  Weight,
} from "lucide-react";
import type { MedicalRecord } from "../../../types/patient";
import {
  getRecordDateOnly,
  getRecordType,
} from "../../../utils/clinicalHistory";
import { formatDateShort, formatDateTimeShort } from "../../../utils/dateUtils";
import { formatWeightWithUnit } from "../../../utils/weight";
import { RECORD_TYPE_META } from "./recordTypeMeta";
import { ExamOrderSummary } from "./ExamOrderSummary";
import { PrintClinicalRecordButton } from "../../print/PrintClinicalRecordButton";

interface ClinicalRecordCardProps {
  record: MedicalRecord;
  onEdit?: () => void;
  onDelete?: () => void;
}

const formatRecordDate = (date: string): string =>
  date.includes("T") ? formatDateTimeShort(date) : formatDateShort(date);

export const ClinicalRecordCard = ({
  record,
  onEdit,
  onDelete,
}: ClinicalRecordCardProps) => {
  const type = getRecordType(record);
  const meta = RECORD_TYPE_META[type];
  const Icon = meta.icon;
  const nextVisit = record.nextVisitAt
    ? formatDateShort(getRecordDateOnly(record.nextVisitAt))
    : "";

  return (
    <div className="relative pl-11 sm:pl-14">
      {/* Punto de la línea de tiempo */}
      <span
        className={`absolute left-0 sm:left-2 top-1 flex h-8 w-8 items-center justify-center rounded-xl border ${meta.accentClass}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <article className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 transition-colors">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${meta.badgeClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {formatRecordDate(record.date)}
            </span>
            {record.weight ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-[#ece883]">
                <Weight className="w-3.5 h-3.5" />
                {formatWeightWithUnit(record.weight, record.weightUnit)}
              </span>
            ) : null}
          </div>

          {(onEdit || onDelete) && (
            <div className="flex flex-wrap items-center gap-1.5">
              <PrintClinicalRecordButton record={record} />
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  title="Editar este registro"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  title="Eliminar este registro"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              )}
            </div>
          )}
        </header>

        {record.diagnosis && (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/70 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Diagnóstico / resultado
            </p>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
              {record.diagnosis}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notas clínicas
            </p>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
              {record.notes || "Sin notas registradas."}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tratamiento / indicaciones
            </p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
              {record.recommendations || "Sin indicaciones adicionales."}
            </p>
          </div>
        </div>

        <ExamOrderSummary order={record.examOrder} />

        {(record.temperature || record.heartRate || record.respiratoryRate) && (
          <div className="rounded-xl bg-slate-900/40 border border-slate-800/60 px-3.5 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Signos vitales
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300">
              {record.temperature && (
                <span>🌡️ Temperatura: {record.temperature}</span>
              )}
              {record.heartRate && (
                <span>❤️ Frec. cardíaca: {record.heartRate}</span>
              )}
              {record.respiratoryRate && (
                <span>🫁 Frec. respiratoria: {record.respiratoryRate}</span>
              )}
            </div>
          </div>
        )}

        {(record.veterinarian || nextVisit) && (
          <footer className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-400">
            {record.veterinarian && (
              <span className="inline-flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                {record.veterinarian}
              </span>
            )}
            {nextVisit && (
              <span className="inline-flex items-center gap-1.5 text-[#ece883]">
                <CalendarClock className="w-3.5 h-3.5" />
                Próximo control: {nextVisit}
              </span>
            )}
          </footer>
        )}
      </article>
    </div>
  );
};

export default ClinicalRecordCard;
