import { useState } from "react";
import { X, Save, Activity, CalendarClock, Clock } from "lucide-react";
import { MiniDatePicker } from "../common/MiniDatePicker";
import {
  normalizeVitalSign,
  VALOR_SIGNO_VITAL_NORMAL,
} from "../../utils/vitalSigns";
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
  /** Fecha y hora local (yyyy-MM-ddTHH:mm) de la próxima revisión. */
  nextReviewAt?: string;
}

const EMPTY_FORM: EvolutionData = {
  notes: "",
  temperature: VALOR_SIGNO_VITAL_NORMAL,
  heartRate: VALOR_SIGNO_VITAL_NORMAL,
  respiratoryRate: VALOR_SIGNO_VITAL_NORMAL,
  treatmentChanges: "",
  nursingObservations: "",
  nextReviewAt: "",
};

export const EvolutionFormModal = ({
  isOpen,
  patient,
  onSave,
  onClose,
}: EvolutionFormModalProps) => {
  const [formData, setFormData] = useState<EvolutionData>(EMPTY_FORM);

  if (!isOpen || !patient) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    onClose();
  };

  const nextReviewDate = formData.nextReviewAt?.slice(0, 10) ?? "";
  const nextReviewTime = formData.nextReviewAt?.slice(11, 16) ?? "";

  const handleNextReviewDate = (isoDate: string) => {
    setFormData((prev) => {
      const time = prev.nextReviewAt?.slice(11, 16) || "09:00";
      return { ...prev, nextReviewAt: isoDate ? `${isoDate}T${time}` : "" };
    });
  };

  const handleNextReviewTime = (time: string) => {
    setFormData((prev) => {
      const date = prev.nextReviewAt?.slice(0, 10);
      return {
        ...prev,
        nextReviewAt: date && time ? `${date}T${time}` : "",
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patient.id, {
      ...formData,
      // Si el usuario dejó el campo vacío, se registra como "normal".
      temperature: normalizeVitalSign(formData.temperature),
      heartRate: normalizeVitalSign(formData.heartRate),
      respiratoryRate: normalizeVitalSign(formData.respiratoryRate),
    });
    setFormData(EMPTY_FORM);
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
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          id="evolution-form"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>
          </div>

          {/* Próxima revisión */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Próxima revisión
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MiniDatePicker
                value={nextReviewDate}
                onChange={handleNextReviewDate}
                icon={<CalendarClock className="w-4 h-4" />}
              />
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  value={nextReviewTime}
                  onChange={(e) => handleNextReviewTime(e.target.value)}
                  disabled={!nextReviewDate}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors disabled:opacity-50"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Si lo dejas vacío, se programará según la frecuencia de monitoreo
              del ingreso.
            </p>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="evolution-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Evolución
          </button>
        </div>
      </div>
    </div>
  );
};
