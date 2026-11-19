import { useId, useState } from "react";
import { ClipboardList, Plus, Save, Trash2, X } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  instructions: string;
}

interface PrescriptionFormModalProps {
  isOpen: boolean;
  onSave: (medications: Medication[]) => void;
  onClose: () => void;
}

export const PrescriptionFormModal = ({
  isOpen,
  onSave,
  onClose,
}: PrescriptionFormModalProps) => {
  const baseId = useId();
  const [medications, setMedications] = useState<Medication[]>([
    { id: crypto.randomUUID(), name: "", instructions: "" },
  ]);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { id: crypto.randomUUID(), name: "", instructions: "" },
    ]);
  };

  const handleRemoveMedication = (id: string) => {
    if (medications.length === 1) return; // No permitir eliminar el último
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleUpdateMedication = (
    id: string,
    field: "name" | "instructions",
    value: string,
  ) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med,
      ),
    );
  };

  const handleSave = () => {
    // Filtrar solo los medicamentos que tienen nombre
    const validMedications = medications.filter(
      (med) => med.name.trim() !== "",
    );
    onSave(validMedications);
  };

  const isValid = medications.some((med) => med.name.trim() !== "");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#ece883]/25 bg-slate-900 shadow-2xl">
        <div className="h-1 shrink-0 bg-gradient-to-r from-[#ece883] via-[#ece883]/60 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 bg-gradient-to-br from-[#ece883]/10 via-slate-900 to-slate-900 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ece883]/30 bg-[#ece883]/10 text-[#ece883]">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ece883]/70">
                Consulta · Receta médica
              </p>
              <h2 className="text-xl font-bold text-white">Receta Médica</h2>
              <p className="mt-1 text-sm text-slate-400">
                Agrega los medicamentos con sus indicaciones para el paciente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar receta médica"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/30 p-6">
          {medications.map((medication, index) => (
            <div
              key={medication.id}
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 transition-colors hover:border-[#ece883]/25"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#ece883]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#ece883]/15 text-[10px]">
                    {index + 1}
                  </span>
                  Medicamento {index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    type="button"
                    aria-label="Eliminar medicamento"
                    onClick={() => handleRemoveMedication(medication.id)}
                    title="Eliminar medicamento"
                    className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-nombre-${medication.id}`}
                  className="mb-1.5 block text-xs font-semibold text-slate-300"
                >
                  Nombre del medicamento
                </label>
                <input
                  id={`${baseId}-nombre-${medication.id}`}
                  type="text"
                  value={medication.name}
                  onChange={(e) =>
                    handleUpdateMedication(
                      medication.id,
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Ej. Amoxicilina 500 mg"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 transition-colors focus:border-[#ece883]/60 focus:outline-none focus:ring-1 focus:ring-[#ece883]/30"
                />
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-indicaciones-${medication.id}`}
                  className="mb-1.5 block text-xs font-semibold text-slate-300"
                >
                  Indicaciones
                </label>
                <textarea
                  id={`${baseId}-indicaciones-${medication.id}`}
                  value={medication.instructions}
                  onChange={(e) =>
                    handleUpdateMedication(
                      medication.id,
                      "instructions",
                      e.target.value,
                    )
                  }
                  placeholder="Ej. Tomar 1 cápsula cada 8 horas por 7 días, después de las comidas"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 transition-colors focus:border-[#ece883]/60 focus:outline-none focus:ring-1 focus:ring-[#ece883]/30"
                />
              </div>
            </div>
          ))}

          {/* Botón agregar medicamento */}
          <button
            type="button"
            onClick={handleAddMedication}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#ece883]/30 bg-[#ece883]/5 px-4 py-3 text-sm font-semibold text-[#ece883] transition-colors hover:border-[#ece883]/60 hover:bg-[#ece883]/10"
          >
            <Plus className="h-4 w-4" />
            Agregar otro medicamento
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-950/40 p-6">
          <p className="hidden text-[11px] text-slate-500 sm:block">
            Ingresa al menos un medicamento para guardar la receta.
          </p>
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ece883] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-[#ece883]/20 transition-colors hover:bg-[#f5f1a0] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none sm:flex-none"
            >
              <Save className="h-4 w-4" />
              Guardar Receta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
