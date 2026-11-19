import { getPetIcon } from "../../../utils/formatters";
import { formatDateShort } from "../../../utils/dateUtils";
import { getSucursalName } from "../../../constants/appConstants";
import type { Appointment } from "../../../types/appointment";
import type { Patient, Owner } from "../../../types/patient";
import type { WeightUnit } from "../../../utils/weight";

interface ConsultationFormProps {
  appointment: Appointment;
  patient: Patient;
  owner: Owner;
  formData: {
    edad: string;
    peso: string;
    weightUnit: WeightUnit;
    condicionesPrevias: string;
    recomendaciones: string;
    diagnostico: string;
    notas: string;
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
  };
  showCondicionesPrevias: boolean;
  previewBirthDate: string | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onWeightUnitChange: (unit: WeightUnit) => void;
}

export const ConsultationForm = ({
  appointment,
  patient,
  owner,
  formData,
  showCondicionesPrevias,
  previewBirthDate,
  onChange,
  onWeightUnitChange,
}: ConsultationFormProps) => {
  const sucursalName = getSucursalName(appointment.sucursalId);
  const compactInputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500";

  return (
    <div className="p-6 space-y-4 overflow-y-auto flex-1">
      {/* Info del paciente y dueño */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <h3 className="text-lg font-bold text-white">{patient.name}</h3>
          {getPetIcon(patient.species, patient.gender)}
        </div>

        <p className="text-xs text-slate-400">
          Propietario:{" "}
          <span className="text-slate-300 font-medium">{owner.name}</span>
          <span className="mx-2">•</span>
          Sucursal:{" "}
          <span className="text-slate-300 font-medium">{sucursalName}</span>
        </p>

        {appointment.motivo && (
          <div className="pt-2 border-t border-slate-800/60">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Motivo de la consulta
            </p>
            <p className="text-sm text-slate-200 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/50">
              "{appointment.motivo}"
            </p>
          </div>
        )}
      </div>

      {/* Edad | Peso (campos compactos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="consulta-edad"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Edad del Paciente
          </label>
          <input
            id="consulta-edad"
            type="text"
            name="edad"
            value={formData.edad}
            onChange={onChange}
            placeholder="Ej. 3 años 2 meses"
            className={compactInputClass}
          />
          {previewBirthDate && (
            <p className="text-[10px] text-slate-500 mt-1 pl-1">
              ≈ Nacimiento estimado: {formatDateShort(previewBirthDate)}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="consulta-peso"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Peso actual
          </label>
          <div className="flex gap-1.5">
            <input
              id="consulta-peso"
              type="number"
              step={formData.weightUnit === "kg" ? "0.1" : "any"}
              min="0"
              name="peso"
              value={formData.peso}
              onChange={onChange}
              placeholder={formData.weightUnit === "kg" ? "Ej. 12.5" : "Ej. 850"}
              className={`${compactInputClass} flex-1 min-w-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
            <div
              className="flex rounded-lg border border-slate-800 overflow-hidden shrink-0"
              role="group"
              aria-label="Unidad del peso"
            >
              {(["kg", "g"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onWeightUnitChange(unit)}
                  aria-pressed={formData.weightUnit === unit}
                  className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    formData.weightUnit === unit
                      ? "bg-[#ece883] text-slate-950"
                      : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {unit === "kg" ? "Kg" : "Gr"}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 pl-1">
            Selecciona Kg o Gr según la unidad del peso.
          </p>
        </div>
      </div>

      {/* Condiciones previas */}
      {showCondicionesPrevias && (
        <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1">
          <label
            htmlFor="consulta-condiciones"
            className="block text-xs font-semibold text-amber-400 mb-1"
          >
            ⚠️ Condiciones Médicas Previas / Alergias (Información Crítica)
          </label>
          <textarea
            id="consulta-condiciones"
            name="condicionesPrevias"
            rows={2}
            value={formData.condicionesPrevias}
            onChange={onChange}
            placeholder="Ej. Alérgico a la penicilina, condición cardíaca leve..."
            className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>
      )}

      {/* Signos vitales: si se dejan vacíos se registran como "normal" */}
      <div>
        <p className="text-xs font-semibold text-slate-300 mb-1">
          Signos vitales{" "}
          <span className="font-normal text-slate-500">
            (si se dejan vacíos se registran como normal)
          </span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="consulta-temperatura"
              className="block text-[11px] text-slate-400 mb-1"
            >
              Temperatura (°C)
            </label>
            <input
              id="consulta-temperatura"
              type="text"
              name="temperature"
              value={formData.temperature}
              onChange={onChange}
              placeholder="Normal"
              className={compactInputClass}
            />
          </div>
          <div>
            <label
              htmlFor="consulta-frecuencia-cardiaca"
              className="block text-[11px] text-slate-400 mb-1"
            >
              Frecuencia cardíaca (lpm)
            </label>
            <input
              id="consulta-frecuencia-cardiaca"
              type="text"
              name="heartRate"
              value={formData.heartRate}
              onChange={onChange}
              placeholder="Normal"
              className={compactInputClass}
            />
          </div>
          <div>
            <label
              htmlFor="consulta-frecuencia-respiratoria"
              className="block text-[11px] text-slate-400 mb-1"
            >
              Frecuencia respiratoria (rpm)
            </label>
            <input
              id="consulta-frecuencia-respiratoria"
              type="text"
              name="respiratoryRate"
              value={formData.respiratoryRate}
              onChange={onChange}
              placeholder="Normal"
              className={compactInputClass}
            />
          </div>
        </div>
      </div>

      {/* Notas de consulta */}
      <div>
        <label
          htmlFor="consulta-notas"
          className="block text-xs font-semibold text-slate-300 mb-1"
        >
          Notas de consulta
        </label>
        <textarea
          id="consulta-notas"
          name="notas"
          rows={3}
          value={formData.notas}
          onChange={onChange}
          placeholder="Escribe las observaciones de la consulta..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Recomendaciones */}
      <div>
        <label
          htmlFor="consulta-recomendaciones"
          className="block text-xs font-semibold text-slate-300 mb-1"
        >
          Recomendaciones para el Propietario
        </label>
        <textarea
          id="consulta-recomendaciones"
          name="recomendaciones"
          rows={2}
          value={formData.recomendaciones}
          onChange={onChange}
          placeholder="Ej. Reposo absoluto..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Diagnóstico al final: se traspasa a la ficha de hospitalización */}
      <div>
        <label
          htmlFor="consulta-diagnostico"
          className="block text-xs font-semibold text-slate-300 mb-1"
        >
          Diagnóstico
        </label>
        <textarea
          id="consulta-diagnostico"
          name="diagnostico"
          rows={3}
          value={formData.diagnostico}
          onChange={onChange}
          placeholder="Escribe el diagnóstico de la consulta..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
};
