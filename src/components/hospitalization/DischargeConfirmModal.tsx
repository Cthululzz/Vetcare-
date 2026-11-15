import { useState } from "react";
import { Calendar, CheckCircle, ClipboardList, X } from "lucide-react";
import { DateInput } from "../common/DateInput";
import type { Patient } from "../../types/patient";
import type { Hospitalization } from "../../types/hospitalization";

export interface DischargeData {
  diagnosis: string;
  treatment: string;
  indications: string;
  /** Fecha local (yyyy-mm-dd) del próximo control. */
  nextControlAt?: string;
}

interface DischargeConfirmModalProps {
  isOpen: boolean;
  patient: Patient | null;
  hospitalization?: Hospitalization | null;
  onConfirm: (data: DischargeData) => void;
  onCancel: () => void;
}

const EMPTY_FORM: DischargeData = {
  diagnosis: "",
  treatment: "",
  indications: "",
  nextControlAt: "",
};

export const DischargeConfirmModal = ({
  isOpen,
  patient,
  hospitalization,
  onConfirm,
  onCancel,
}: DischargeConfirmModalProps) => {
  const [formData, setFormData] = useState<DischargeData>(EMPTY_FORM);
  const [error, setError] = useState("");

  if (!isOpen || !patient) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleCancel = () => {
    setFormData(EMPTY_FORM);
    setError("");
    onCancel();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.diagnosis.trim()) {
      setError("Ingresa el diagnóstico de alta.");
      return;
    }
    if (!formData.indications.trim()) {
      setError("Ingresa las indicaciones para el paciente.");
      return;
    }

    onConfirm({
      diagnosis: formData.diagnosis.trim(),
      treatment: formData.treatment.trim(),
      indications: formData.indications.trim(),
      nextControlAt: formData.nextControlAt || undefined,
    });
    setFormData(EMPTY_FORM);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Alta de Hospitalización
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Paciente:{" "}
                <span className="text-white font-medium">{patient.name}</span>
                {hospitalization?.bed ? ` • ${hospitalization.bed}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="discharge-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-[#ece883] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              El resumen de alta quedará guardado en la internación y en el
              historial clínico del paciente. La cama se liberará
              automáticamente.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Diagnóstico de alta *
            </label>
            <input
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Ej. Gastroenteritis aguda resuelta"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Tratamiento realizado
            </label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              rows={3}
              placeholder="Fluidoterapia, antibióticos, procedimientos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Indicaciones al propietario *
            </label>
            <textarea
              name="indications"
              value={formData.indications}
              onChange={handleChange}
              rows={3}
              placeholder="Cuidados en domicilio, medicamentos, signos de alarma..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Próximo control
            </label>
            <DateInput
              name="nextControlAt"
              value={formData.nextControlAt ?? ""}
              onChange={(isoDate) =>
                setFormData((prev) => ({ ...prev, nextControlAt: isoDate }))
              }
              icon={<Calendar className="w-4 h-4" />}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-slate-800/60">
            <p className="text-xs text-amber-400 font-medium">
              ⚠️ Asegúrate de que el paciente esté estable para el alta y de
              haber registrado toda la evolución necesaria.
            </p>
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="discharge-form"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar Alta
          </button>
        </div>
      </div>
    </div>
  );
};
