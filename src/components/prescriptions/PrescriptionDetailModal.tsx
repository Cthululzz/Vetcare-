import { CalendarDays, Pill, Printer, User, X } from "lucide-react";
import type { Prescription } from "../../types/prescription";
import { formatDateTimeShort } from "../../utils/dateUtils";

interface PrescriptionDetailModalProps {
  prescription: Prescription;
  patientName: string;
  veterinarian?: string;
  onClose: () => void;
  onPrint: () => void;
}

/** Detalle de una receta, con todos sus medicamentos e indicaciones. */
export const PrescriptionDetailModal = ({
  prescription,
  patientName,
  veterinarian,
  onClose,
  onPrint,
}: PrescriptionDetailModalProps) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-detail-title"
      className="my-6 w-full max-w-2xl space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
    >
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ece883]/20 bg-[#ece883]/10">
            <Pill className="h-5 w-5 text-[#ece883]" />
          </div>
          <div>
            <h2
              id="prescription-detail-title"
              className="text-base font-bold text-white"
            >
              Detalle de la receta
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateTimeShort(prescription.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {patientName}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
          Medicamentos ({prescription.medications.length})
        </h3>
        {prescription.medications.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            Esta receta no registra medicamentos.
          </p>
        ) : (
          <ul className="space-y-3">
            {prescription.medications.map((medication, index) => (
              <li
                key={medication.id || index}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-sm font-bold text-white">{medication.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  <span className="font-semibold text-slate-400">
                    Indicaciones:{" "}
                  </span>
                  {medication.instructions || "Sin indicaciones registradas."}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {prescription.notes ? (
        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
            Notas
          </h3>
          <p className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-300">
            {prescription.notes}
          </p>
        </section>
      ) : null}

      {veterinarian ? (
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Profesional: </span>
          {veterinarian}
        </p>
      ) : null}

      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir receta
        </button>
      </footer>
    </div>
  </div>
);
