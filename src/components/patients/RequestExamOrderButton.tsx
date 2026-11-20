import { useState } from "react";
import { CheckCircle2, FlaskConical, Printer } from "lucide-react";
import { ExamOrderModal } from "../schedule/ConsultationModal/ExamOrderModal";
import { printExamOrder } from "../print/printExamOrder";
import { getExamenCategoriaLabel } from "../../constants/examOrders";
import { usePatients } from "../../hooks/usePatients";
import { useAuth } from "../../hooks/useAuth";
import type { Patient } from "../../types/patient";
import type { ExamOrder } from "../../types/examOrder";

interface RequestExamOrderButtonProps {
  patient: Patient;
  /** Deshabilita la acción (por ejemplo, en modo lectura). */
  disabled?: boolean;
  /** Texto del botón. */
  label?: string;
  /** Clases del botón; permite adaptarlo al contexto donde se usa. */
  className?: string;
  /** Ayuda que se muestra dentro del modal. */
  description?: string;
}

const DEFAULT_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Botón reutilizable para indicar exámenes fuera de la consulta.
 * Guarda la orden como un registro de tipo "examen" en el historial clínico y
 * ofrece imprimirla de inmediato, sin tener que ir a la ficha del paciente.
 */
export const RequestExamOrderButton = ({
  patient,
  disabled = false,
  label = "Solicitar exámenes",
  className = DEFAULT_BUTTON_CLASS,
  description,
}: RequestExamOrderButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ordenGenerada, setOrdenGenerada] = useState<ExamOrder | null>(null);
  const { addMedicalRecord } = usePatients();
  const { user } = useAuth();

  const cerrar = () => {
    setIsOpen(false);
    setOrdenGenerada(null);
  };

  const handleSave = (order: ExamOrder) => {
    addMedicalRecord(patient.id, {
      date: new Date().toISOString(),
      notes: order.notes ?? "",
      type: "examen",
      examOrder: order,
      veterinarian: user?.name,
    });
    setOrdenGenerada(order);
  };

  const handleImprimir = () => {
    if (!ordenGenerada) return;
    printExamOrder(ordenGenerada, patient.name, user?.name);
    cerrar();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOrdenGenerada(null);
          setIsOpen(true);
        }}
        disabled={disabled}
        className={className}
      >
        <FlaskConical className="w-3.5 h-3.5" /> {label}
      </button>

      {isOpen && !ordenGenerada && (
        <ExamOrderModal
          isOpen
          onSave={handleSave}
          onClose={cerrar}
          description={description}
        />
      )}

      {isOpen && ordenGenerada && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-900 shadow-2xl">
            <div className="h-1 bg-gradient-to-r from-violet-400 via-violet-400/60 to-transparent" />

            <div className="bg-gradient-to-br from-violet-500/10 via-slate-900 to-slate-900 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl border border-violet-500/30 bg-violet-500/10 text-violet-300">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white">
                    Orden registrada
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    La orden quedó en el historial clínico de {patient.name}.
                    ¿Deseas imprimirla ahora?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {ordenGenerada.categories.map((categoria) => (
                  <span
                    key={categoria}
                    className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-200"
                  >
                    {getExamenCategoriaLabel(categoria)}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Se abrirá el diálogo de impresión con la orden de exámenes.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={cerrar}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Omitir
                </button>
                <button
                  type="button"
                  onClick={handleImprimir}
                  className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold transition-colors shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Imprimir orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
