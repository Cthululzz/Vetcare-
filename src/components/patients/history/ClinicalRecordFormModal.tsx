import { useState } from "react";
import { ClipboardPlus, Pencil, Save, X } from "lucide-react";
import { DateInput } from "../../common/DateInput";
import { usePatients } from "../../../hooks/usePatients";
import type { MedicalRecord, MedicalRecordType } from "../../../types/patient";
import {
  getRecordDateOnly,
  getRecordType,
  MANUAL_RECORD_TYPES,
  MEDICAL_RECORD_TYPE_LABELS,
} from "../../../utils/clinicalHistory";
import { getLocalTodayStr } from "../../../utils/dateUtils";
import {
  convertWeight,
  normalizeWeightUnit,
  type WeightUnit,
} from "../../../utils/weight";

interface ClinicalRecordFormModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  record?: MedicalRecord | null;
  defaultVeterinarian?: string;
  onClose: () => void;
  onSaved?: () => void;
}

const fieldClass =
  "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60";
const labelClass = "text-xs font-semibold text-slate-400";

export const ClinicalRecordFormModal = ({
  isOpen,
  patientId,
  patientName,
  record,
  defaultVeterinarian,
  onClose,
  onSaved,
}: ClinicalRecordFormModalProps) => {
  const { addMedicalRecord, updateMedicalRecord } = usePatients();

  const isEditing = Boolean(record);
  const initialType = record ? getRecordType(record) : "consulta";

  const [type, setType] = useState<MedicalRecordType>(
    MANUAL_RECORD_TYPES.includes(initialType) ? initialType : "nota",
  );
  const [date, setDate] = useState(
    record ? getRecordDateOnly(record.date) : getLocalTodayStr(),
  );
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [diagnosis, setDiagnosis] = useState(record?.diagnosis ?? "");
  const [recommendations, setRecommendations] = useState(
    record?.recommendations ?? "",
  );
  const [weight, setWeight] = useState(
    record?.weight != null ? String(record.weight) : "",
  );
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(
    normalizeWeightUnit(record?.weightUnit),
  );
  const [nextVisitAt, setNextVisitAt] = useState(
    record?.nextVisitAt ? getRecordDateOnly(record.nextVisitAt) : "",
  );
  const [veterinarian, setVeterinarian] = useState(
    record?.veterinarian ?? defaultVeterinarian ?? "",
  );
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!date) {
      setError("Selecciona la fecha del registro.");
      return;
    }

    if (!notes.trim()) {
      setError("Ingresa el detalle o las notas clínicas.");
      return;
    }

    let weightValue: number | undefined;
    if (weight.trim()) {
      const parsed = Number(weight.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError("El peso debe ser un número mayor que cero.");
        return;
      }
      weightValue = Math.round(parsed * 100) / 100;
    }

    if (nextVisitAt && nextVisitAt < date) {
      setError("El próximo control no puede ser anterior a la fecha del registro.");
      return;
    }

    if (record) {
      updateMedicalRecord(patientId, record.id, {
        date,
        type,
        notes: notes.trim(),
        diagnosis: diagnosis.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        weight: weightValue,
        weightUnit: weightValue != null ? weightUnit : undefined,
        nextVisitAt: nextVisitAt || undefined,
        veterinarian: veterinarian.trim() || undefined,
      });
    } else {
      addMedicalRecord(patientId, {
        date,
        type,
        notes: notes.trim(),
        diagnosis: diagnosis.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        weight: weightValue,
        weightUnit: weightValue != null ? weightUnit : undefined,
        nextVisitAt: nextVisitAt || undefined,
        veterinarian: veterinarian.trim() || undefined,
      });
    }

    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <header className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              {isEditing ? (
                <Pencil className="w-5 h-5" />
              ) : (
                <ClipboardPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Editar registro clínico" : "Nuevo registro clínico"}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {patientName} · el registro se{" "}
                {isEditing ? "actualizará en" : "agregará a"} su historial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className={labelClass}>Tipo de registro</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as MedicalRecordType)
                }
                className={fieldClass}
              >
                {MANUAL_RECORD_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {MEDICAL_RECORD_TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <DateInput
              value={date}
              onChange={setDate}
              required
              label={<span className={labelClass}>Fecha</span>}
              labelClassName="block mb-1.5"
              className={fieldClass}
            />
          </div>

          <label className="block space-y-1.5">
            <span className={labelClass}>
              {type === "vacunacion"
                ? "Vacuna aplicada y observaciones"
                : type === "desparasitacion"
                  ? "Producto aplicado y observaciones"
                  : type === "examen"
                    ? "Examen solicitado / realizado"
                    : type === "procedimiento"
                      ? "Procedimiento realizado"
                      : "Notas clínicas / motivo"}
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              required
              placeholder="Describe el motivo, hallazgos y evolución del paciente."
              className={fieldClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Diagnóstico / resultado (opcional)</span>
            <input
              type="text"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="Ej: Otitis externa bacteriana"
              className={fieldClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>
              Tratamiento / indicaciones (opcional)
            </span>
            <textarea
              value={recommendations}
              onChange={(event) => setRecommendations(event.target.value)}
              rows={3}
              placeholder="Medicamentos, cuidados en casa, controles."
              className={fieldClass}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <span className={`${labelClass} block`}>Peso (opcional)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  placeholder={weightUnit === "kg" ? "Ej: 12,5" : "Ej: 850"}
                  className={fieldClass}
                />
                <select
                  value={weightUnit}
                  onChange={(event) => {
                    const unit: WeightUnit =
                      event.target.value === "g" ? "g" : "kg";
                    const parsed = Number(weight.replace(",", "."));
                    if (weight.trim() && Number.isFinite(parsed)) {
                      setWeight(
                        String(convertWeight(parsed, weightUnit, unit)).replace(
                          ".",
                          ",",
                        ),
                      );
                    }
                    setWeightUnit(unit);
                  }}
                  aria-label="Unidad del peso"
                  className={`${fieldClass} w-20 cursor-pointer font-semibold`}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>

            <DateInput
              value={nextVisitAt}
              onChange={setNextVisitAt}
              label={<span className={labelClass}>Próximo control (opcional)</span>}
              labelClassName="block mb-1.5"
              className={fieldClass}
            />

            <label className="space-y-1.5">
              <span className={labelClass}>Profesional (opcional)</span>
              <input
                type="text"
                value={veterinarian}
                onChange={(event) => setVeterinarian(event.target.value)}
                placeholder="Nombre del veterinario"
                className={fieldClass}
              />
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicalRecordFormModal;
