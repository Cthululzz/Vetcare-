import { useState } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Receta Médica</h2>
            <p className="text-sm text-slate-400 mt-1">
              Agrega los medicamentos con sus indicaciones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {medications.map((medication, index) => (
            <div
              key={medication.id}
              className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Medicamento {index + 1}
                </span>
                {medications.length > 1 && (
                  <button
                    onClick={() => handleRemoveMedication(medication.id)}
                    className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                    title="Eliminar medicamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre del medicamento
                </label>
                <input
                  type="text"
                  value={medication.name}
                  onChange={(e) =>
                    handleUpdateMedication(
                      medication.id,
                      "name",
                      e.target.value,
                    )
                  }
                  placeholder="Ej. Amoxicilina 500mg"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Indicaciones
                </label>
                <textarea
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>
          ))}

          {/* Botón agregar medicamento */}
          <button
            onClick={handleAddMedication}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-700 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar otro medicamento
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Guardar Receta
          </button>
        </div>
      </div>
    </div>
  );
};
