import { useState } from "react";
import { CheckCircle2, FileText, FlaskConical, Printer } from "lucide-react";
import { printConsultationDocuments } from "../../print/printConsultationDocuments";
import type { FinishPrintDocuments } from "../../../types/consultation";

interface PrintAfterFinishModalProps {
  documents: FinishPrintDocuments;
  onClose: () => void;
}

/**
 * Pop-up que se muestra justo después de finalizar la consulta. Solo ofrece
 * los documentos que realmente se generaron: la receta creada y/u orden de
 * exámenes con categorías.
 */
export const PrintAfterFinishModal = ({
  documents,
  onClose,
}: PrintAfterFinishModalProps) => {
  const tieneReceta = Boolean(documents.prescription);
  const tieneOrden = Boolean(documents.examOrder?.categories.length);
  const [imprimirReceta, setImprimirReceta] = useState(tieneReceta);
  const [imprimirOrden, setImprimirOrden] = useState(tieneOrden);

  if (!tieneReceta && !tieneOrden) return null;

  const haySeleccion =
    (imprimirReceta && tieneReceta) || (imprimirOrden && tieneOrden);

  const handleImprimir = () => {
    printConsultationDocuments({
      ...documents,
      prescription: imprimirReceta ? documents.prescription : undefined,
      examOrder: imprimirOrden ? documents.examOrder : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#ece883]/25 bg-slate-900 shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-[#ece883] via-[#ece883]/60 to-transparent" />

        <div className="bg-gradient-to-br from-[#ece883]/10 via-slate-900 to-slate-900 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl border border-[#ece883]/30 bg-[#ece883]/10 text-[#ece883]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white">
                Consulta finalizada
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                ¿Deseas imprimir los documentos para entregarlos al cliente
                ahora mismo?
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {tieneReceta && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-3 transition-colors hover:border-[#ece883]/40">
                <input
                  type="checkbox"
                  checked={imprimirReceta}
                  onChange={(event) => setImprimirReceta(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#ece883]"
                />
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#ece883]" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    Receta médica
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Medicamentos e indicaciones de la consulta.
                  </span>
                </span>
              </label>
            )}

            {tieneOrden && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-3 transition-colors hover:border-violet-400/50">
                <input
                  type="checkbox"
                  checked={imprimirOrden}
                  onChange={(event) => setImprimirOrden(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-400"
                />
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">
                    Orden de exámenes
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Categorías solicitadas e indicaciones para el laboratorio.
                  </span>
                </span>
              </label>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            {haySeleccion
              ? "Se abrirá un solo diálogo de impresión con los documentos seleccionados."
              : "Selecciona al menos un documento para imprimir."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Omitir
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              disabled={!haySeleccion}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-[#ece883]/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Printer className="h-4 w-4" /> Imprimir seleccionados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
