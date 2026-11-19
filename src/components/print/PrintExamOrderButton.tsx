import { Printer } from "lucide-react";
import { EXAMEN_CATEGORIAS } from "../../constants/examOrders";
import { formatDateTimeShort } from "../../utils/dateUtils";
import { printDocument } from "../../utils/print";
import { buildExamOrderHtml } from "./printHelpers";
import type { ExamOrder } from "../../types/examOrder";

interface PrintExamOrderButtonProps {
  order: ExamOrder;
  patientName?: string;
  veterinarian?: string;
  compact?: boolean;
}

const CATEGORY_LABELS = Object.fromEntries(
  EXAMEN_CATEGORIAS.map(({ id, label }) => [id, label]),
);

export const PrintExamOrderButton = ({
  order,
  patientName,
  veterinarian,
  compact = false,
}: PrintExamOrderButtonProps) => (
  <button
    type="button"
    onClick={() =>
      printDocument({
        title: "Orden de exámenes",
        subtitle: patientName ?? undefined,
        bodyHtml: buildExamOrderHtml(
          {
            ...order,
            createdAt: order.createdAt
              ? formatDateTimeShort(order.createdAt)
              : undefined,
            veterinarian,
          },
          CATEGORY_LABELS,
        ),
      })
    }
    className={`inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition-colors hover:border-violet-400/60 hover:text-white ${
      compact ? "" : "sm:text-xs"
    }`}
    title="Imprimir orden de exámenes"
  >
    <Printer className="h-3.5 w-3.5" />
    Imprimir orden
  </button>
);
