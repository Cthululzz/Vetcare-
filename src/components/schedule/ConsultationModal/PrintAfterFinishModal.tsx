import { useState } from "react";
import {
  CheckCircle2,
  FileText,
  FlaskConical,
  Mail,
  Printer,
  Send,
} from "lucide-react";
import { printConsultationDocuments } from "../../print/printConsultationDocuments";
import type { FinishPrintDocuments } from "../../../types/consultation";

interface PrintAfterFinishModalProps {
  documents: FinishPrintDocuments;
  onClose: () => void;
}

/**
 * Pop-up que se muestra justo después de finalizar la consulta. Ofrece los
 * documentos que realmente se generaron: la receta creada y/u orden de
 * exámenes con categorías. El envío por correo queda visible pero se habilita
 * recién con la migración a backend.
 */
export const PrintAfterFinishModal = ({
  documents,
  onClose,
}: PrintAfterFinishModalProps) => {
  const tieneReceta = Boolean(documents.prescription);
  const tieneOrden = Boolean(documents.examOrder?.categories.length);
  const [incluirReceta, setIncluirReceta] = useState(tieneReceta);
  const [incluirOrden, setIncluirOrden] = useState(tieneOrden);
  const [avisoMail, setAvisoMail] = useState(false);

  if (!tieneReceta && !tieneOrden) return null;

  const haySeleccion =
    (incluirReceta && tieneReceta) || (incluirOrden && tieneOrden);

  const documentosSeleccionados = (): FinishPrintDocuments => ({
    ...documents,
    prescription: incluirReceta ? documents.prescription : undefined,
    examOrder: incluirOrden ? documents.examOrder : undefined,
  });

  const imprimir = () => {
    printConsultationDocuments(documentosSeleccionados());
  };

  const handleImprimir = () => {
    imprimir();
    onClose();
  };

  const handleEnviarMail = () => {
    setAvisoMail(true);
  };

  const handleImprimirYEnviar = () => {
    imprimir();
    onClose();
    window.alert(
      "Los documentos seleccionados se enviarán al correo cuando se active la integración con el backend.",
    );
  };

  const botonBase =
    "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";

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
                Elige qué documentos deseas entregar o enviar al cliente.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {tieneReceta && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-3 transition-colors hover:border-[#ece883]/40">
                <input
                  type="checkbox"
                  checked={incluirReceta}
                  onChange={(event) => setIncluirReceta(event.target.checked)}
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
                  checked={incluirOrden}
                  onChange={(event) => setIncluirOrden(event.target.checked)}
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
              ? "Imprimir abrirá un solo diálogo con los documentos seleccionados."
              : "Selecciona al menos un documento."}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {documents.ownerEmail
              ? `Correo del dueño: ${documents.ownerEmail}.`
              : "El dueño no tiene un correo registrado."}
          </p>

          {avisoMail && (
            <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-200">
              El envío por correo se habilitará con la migración a backend. Por
              ahora puedes imprimir los documentos seleccionados.
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className={`${botonBase} bg-slate-800 hover:bg-slate-700 text-slate-300`}
            >
              Omitir
            </button>
            <button
              type="button"
              onClick={handleImprimir}
              disabled={!haySeleccion}
              className={`${botonBase} bg-[#ece883] hover:bg-[#e4df68] text-slate-950 shadow-lg shadow-[#ece883]/20`}
            >
              <Printer className="h-4 w-4" /> Imprimir seleccionados
            </button>
            <button
              type="button"
              onClick={handleEnviarMail}
              disabled={!haySeleccion}
              className={`${botonBase} border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200`}
            >
              <Send className="h-4 w-4" /> Enviar al mail
            </button>
            <button
              type="button"
              onClick={handleImprimirYEnviar}
              disabled={!haySeleccion}
              className={`${botonBase} border border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200`}
            >
              <Mail className="h-4 w-4" /> Imprimir y enviar al mail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
