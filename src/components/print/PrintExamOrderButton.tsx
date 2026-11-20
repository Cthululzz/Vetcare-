import { Printer } from "lucide-react";
import type { ExamOrder } from "../../types/examOrder";
import { printExamOrder } from "./printExamOrder";

interface PrintExamOrderButtonProps {
  order: ExamOrder;
  patientName?: string;
  veterinarian?: string;
  compact?: boolean;
}

export const PrintExamOrderButton = ({
  order,
  patientName,
  veterinarian,
  compact = false,
}: PrintExamOrderButtonProps) => (
  <button
    type="button"
    onClick={() => printExamOrder(order, patientName, veterinarian)}
    className={`inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition-colors hover:border-violet-400/60 hover:text-white ${
      compact ? "" : "sm:text-xs"
    }`}
    title="Imprimir orden de exámenes"
  >
    <Printer className="h-3.5 w-3.5" />
    Imprimir orden
  </button>
);
