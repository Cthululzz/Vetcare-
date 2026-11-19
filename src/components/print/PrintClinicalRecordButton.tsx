import { Printer } from "lucide-react";
import { EXAMEN_CATEGORIAS } from "../../constants/examOrders";
import { formatDateTimeShort } from "../../utils/dateUtils";
import { printDocument } from "../../utils/print";
import { buildClinicalRecordHtml } from "./printHelpers";
import type { MedicalRecord } from "../../types/patient";

interface PrintClinicalRecordButtonProps {
  record: MedicalRecord;
  patientName?: string;
  className?: string;
}

const CATEGORY_LABELS = Object.fromEntries(
  EXAMEN_CATEGORIAS.map(({ id, label }) => [id, label]),
);

export const PrintClinicalRecordButton = ({
  record,
  patientName,
  className = "",
}: PrintClinicalRecordButtonProps) => (
  <button
    type="button"
    onClick={() =>
      printDocument({
        title: "Registro clínico",
        subtitle: patientName ?? undefined,
        bodyHtml: buildClinicalRecordHtml(
          {
            ...record,
            date: formatDateTimeShort(record.date),
            weightUnit: record.weightUnit ?? "kg",
          },
          CATEGORY_LABELS,
          patientName,
        ),
      })
    }
    className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:border-[#ece883]/40 hover:text-[#ece883] ${className}`}
  >
    <Printer className="h-3.5 w-3.5" />
    Imprimir
  </button>
);
