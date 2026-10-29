import { getPetIcon } from "../../../utils/formatters";
import { formatDateLatam } from "../../../utils/dateUtils";
import { getSucursalName } from "../../../constants/appConstants";
import type { Appointment } from "../../../types/appointment";
import type { Patient, Owner } from "../../../types/patient";

interface ConsultationFormProps {
  appointment: Appointment;
  patient: Patient;
  owner: Owner;
  formData: {
    edad: string;
    peso: string;
    condicionesPrevias: string;
    recomendaciones: string;
    notas: string;
  };
  showCondicionesPrevias: boolean;
  previewBirthDate: string | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export const ConsultationForm = ({
  appointment,
  patient,
  owner,
  formData,
  showCondicionesPrevias,
  previewBirthDate,
  onChange,
}: ConsultationFormProps) => {
  const sucursalName = getSucursalName(appointment.sucursalId);

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

      {/* Edad | Peso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Edad del Paciente
          </label>
          <input
            type="text"
            name="edad"
            value={formData.edad}
            onChange={onChange}
            placeholder="Ej. 3 años y 2 meses"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
          {previewBirthDate && (
            <p className="text-[10px] text-slate-500 mt-1 pl-1">
              ≈ Nacimiento estimado: {formatDateLatam(previewBirthDate)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Peso actual (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            name="peso"
            value={formData.peso}
            onChange={onChange}
            placeholder="Ej. 12.5"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Condiciones previas */}
      {showCondicionesPrevias && (
        <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1">
          <label className="block text-xs font-semibold text-amber-400 mb-1">
            ⚠️ Condiciones Médicas Previas / Alergias (Información Crítica)
          </label>
          <textarea
            name="condicionesPrevias"
            rows={2}
            value={formData.condicionesPrevias}
            onChange={onChange}
            placeholder="Ej. Alérgico a la penicilina, condición cardíaca leve..."
            className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>
      )}

      {/* Notas clínicas */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Notas de la Consulta / Diagnóstico
        </label>
        <textarea
          name="notas"
          rows={3}
          value={formData.notas}
          onChange={onChange}
          placeholder="Escribe las observaciones..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Recomendaciones */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Recomendaciones para el Propietario
        </label>
        <textarea
          name="recomendaciones"
          rows={2}
          value={formData.recomendaciones}
          onChange={onChange}
          placeholder="Ej. Reposo absoluto..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
};
