import { CalendarDays, Eye, Pill, Printer, Trash2 } from "lucide-react";
import type { Prescription } from "../../types/prescription";
import { formatDateTimeShort } from "../../utils/dateUtils";

interface PrescriptionCardProps {
  prescription: Prescription;
  patientName: string;
  onView: () => void;
  onPrint: () => void;
  onDelete: () => void;
}

export const PrescriptionCard = ({
  prescription,
  patientName,
  onView,
  onPrint,
  onDelete,
}: PrescriptionCardProps) => {
  const cantidad = prescription.medications.length;
  const nombresMedicamentos = prescription.medications
    .map((medication) => medication.name)
    .join(" · ");

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ece883]/20 bg-[#ece883]/10">
          <Pill className="h-5 w-5 text-[#ece883]" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white">
              {patientName}
            </h3>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
              {cantidad} {cantidad === 1 ? "medicamento" : "medicamentos"}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {formatDateTimeShort(prescription.createdAt)}
          </p>
          {nombresMedicamentos ? (
            <p className="truncate text-xs text-slate-500" title={nombresMedicamentos}>
              {nombresMedicamentos}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#ece883]/30 bg-[#ece883]/10 px-3 py-2 text-xs font-semibold text-[#ece883] transition-colors hover:bg-[#ece883]/20 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver detalle
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </article>
  );
};
