import { useState } from "react";
import { Check, FlaskConical, X } from "lucide-react";
import { EXAMEN_CATEGORIAS } from "../../../constants/examOrders";
import { EXAM_CATEGORY_IDS } from "../../../types/examOrder";
import type { ExamCategoryId, ExamOrder } from "../../../types/examOrder";

interface ExamOrderModalProps {
  isOpen: boolean;
  initialOrder?: ExamOrder;
  onSave: (order: ExamOrder) => void;
  onClose: () => void;
}

export const ExamOrderModal = ({
  isOpen,
  initialOrder,
  onSave,
  onClose,
}: ExamOrderModalProps) => {
  const iniciales = (initialOrder?.categories ?? []).filter((id) =>
    EXAM_CATEGORY_IDS.includes(id),
  );
  const [seleccionadas, setSeleccionadas] =
    useState<ExamCategoryId[]>(iniciales);
  const [notas, setNotas] = useState(initialOrder?.notes ?? "");

  if (!isOpen) return null;

  const alternar = (id: ExamCategoryId) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const guardar = () => {
    if (seleccionadas.length === 0) return;
    onSave({
      categories: EXAM_CATEGORY_IDS.filter((id) => seleccionadas.includes(id)),
      notes: notas.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-violet-500/30 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-transparent p-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Orden de exámenes
                </h2>
                <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                  {seleccionadas.length} seleccionado
                  {seleccionadas.length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Marca las áreas que deben evaluarse. Puedes ajustar la orden
                antes de finalizar la consulta.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar orden de exámenes"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-950/30 p-6">
          {EXAMEN_CATEGORIAS.map((opcion) => {
            const seleccionada = seleccionadas.includes(opcion.id);
            const Icon = opcion.icon;
            const inputId = `examen-${opcion.id}`;

            return (
              <div key={opcion.id}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={seleccionada}
                  onChange={() => alternar(opcion.id)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400/60 ${
                    seleccionada
                      ? "border-violet-500/50 bg-violet-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      seleccionada
                        ? "border-violet-400 bg-violet-500 text-slate-950"
                        : "border-slate-600 bg-slate-900"
                    }`}
                  >
                    {seleccionada && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      seleccionada ? "text-violet-300" : "text-slate-500"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      {opcion.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {opcion.description}
                    </span>
                  </span>
                </label>
              </div>
            );
          })}

          <div className="pt-2">
            <label
              htmlFor="examen-notas"
              className="mb-1.5 block text-xs font-semibold text-slate-300"
            >
              Indicaciones adicionales (opcional)
            </label>
            <textarea
              id="examen-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              rows={3}
              placeholder="Ej. Solicitar hemograma completo y perfil tiroideo. Ayuno de 8 horas."
              className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-violet-400/60 focus:outline-none focus:ring-1 focus:ring-violet-400/30"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 p-6">
          <p className="hidden text-[11px] text-slate-500 sm:block">
            La orden quedará registrada en el historial clínico del paciente.
          </p>
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={seleccionadas.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 sm:flex-none"
            >
              <FlaskConical className="h-4 w-4" />
              Guardar orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
