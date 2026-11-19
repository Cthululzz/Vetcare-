import { FlaskConical } from "lucide-react";
import { getExamenCategoriaLabel } from "../../../constants/examOrders";
import type { ExamOrder } from "../../../types/examOrder";
import { PrintExamOrderButton } from "../../print/PrintExamOrderButton";

interface ExamOrderSummaryProps {
  order?: ExamOrder;
  /** Variante compacta para tarjetas dentro del perfil del paciente. */
  compact?: boolean;
  patientName?: string;
}

export const ExamOrderSummary = ({
  order,
  compact = false,
  patientName,
}: ExamOrderSummaryProps) => {
  if (!order || order.categories.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-violet-500/25 bg-violet-500/5 ${
        compact ? "p-3" : "p-3.5"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <FlaskConical className="h-3.5 w-3.5" />
          Orden de exámenes
        </span>
        <PrintExamOrderButton order={order} patientName={patientName} compact />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {order.categories.map((category) => (
          <span
            key={category}
            className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-200"
          >
            {getExamenCategoriaLabel(category)}
          </span>
        ))}
      </div>
      {order.notes && (
        <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-300">
          {order.notes}
        </p>
      )}
    </div>
  );
};
