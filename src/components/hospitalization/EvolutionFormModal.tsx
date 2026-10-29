import { useState } from "react";
import { X, Save, Activity } from "lucide-react";
import type { Patient } from "../../types/patient";

interface EvolutionFormModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onSave: (patientId: string, evolutionData: EvolutionData) => void;
  onClose: () => void;
}

export interface EvolutionData {
  notes: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  treatmentChanges?: string;
  nursingObservations?: string;
}

export const EvolutionFormModal = ({
  isOpen,
  patient,
  onSave,
  onClose,
}: EvolutionFormModalProps) => {
  const [formData, setFormData] = useState<EvolutionData>({
    notes: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    treatmentChanges: "",
    nursingObservations: "",
  });

  if (!isOpen || !patient) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patient.id, formData);
    // Reset form
    setFormData({
      notes: "",
      temperature: "",
      heartRate: "",
      respiratoryRate: "",
      treatmentChanges: "",
      nursingObservations: "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Registrar Evolución
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Paciente:{" "}
                <span className="text-white font-medium">{patient.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Notas de Evolución */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Notas de Evolución *
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describa el estado actual del paciente, evolución clínica, respuesta al tratamiento..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Signos Vitales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Temperatura (°C)
              </label>
              <input
                type="text"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                placeholder="Ej. 38.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Frec. Cardíaca (lpm)
              </label>
              <input
                type="text"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleChange}
                placeholder="Ej. 120"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Frec. Respiratoria (rpm)
              </label>
              <input
                type="text"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleChange}
                placeholder="Ej. 20"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Cambios en Tratamiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Cambios en Tratamiento
            </label>
            <textarea
              name="treatmentChanges"
              value={formData.treatmentChanges}
              onChange={handleChange}
              rows={2}
              placeholder="Medicamentos agregados, modificados o suspendidos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Observaciones de Enfermería */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Observaciones de Enfermería
            </label>
            <textarea
              name="nursingObservations"
              value={formData.nursingObservations}
              onChange={handleChange}
              rows={2}
              placeholder="Alimentación, hidratación, comportamiento, movilidad..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" />
            Guardar Evolución
          </button>
        </div>
      </div>
    </div>
  );
};
