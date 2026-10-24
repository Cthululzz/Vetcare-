import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Heart, Dna, Mars, Venus } from "lucide-react";
import {
  ESPECIES_MASCOTA,
  getEspecieLabel,
} from "../../../constants/appConstants";
import type { AppointmentFormData } from "./AppointmentForm";

interface PetInfoSectionProps {
  formData: AppointmentFormData;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  setFormData: Dispatch<SetStateAction<AppointmentFormData>>;
}

export const PetInfoSection = ({
  formData,
  onChange,
  setFormData,
}: PetInfoSectionProps) => {
  const fieldClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  const selectClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-4 text-sm text-white focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  return (
    <div className="space-y-3.5">
      {/* Nombre del Paciente */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Nombre del Paciente
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Heart className="w-4 h-4" />
          </span>
          <input
            type="text"
            name="patientName"
            required
            value={formData.patientName}
            onChange={onChange}
            placeholder="Ej. Max"
            className={fieldClassName}
          />
        </div>
      </div>

      {/* Raza */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Raza
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Dna className="w-4 h-4" />
          </span>
          <input
            type="text"
            name="breed"
            value={formData.breed || ""}
            onChange={onChange}
            placeholder="Ej. Golden Retriever"
            className={fieldClassName}
          />
        </div>
      </div>

      {/* Fila: Especie + Género */}
      <div className="grid grid-cols-2 gap-3">
        {/* Especie (select) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Especie
          </label>
          <select
            name="species"
            value={formData.species}
            onChange={onChange}
            className={selectClassName}
          >
            {ESPECIES_MASCOTA.map((esp) => (
              <option key={esp} value={esp} className="bg-slate-900 text-white">
                {getEspecieLabel(esp)}
              </option>
            ))}
          </select>
        </div>

        {/* Género (botones de solo ícono) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Género
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, gender: "macho" }))
              }
              title="Macho"
              className={`flex-1 flex items-center justify-center py-3 rounded-xl border transition-all cursor-pointer ${
                formData.gender === "macho"
                  ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/20"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
              }`}
            >
              <Mars className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, gender: "hembra" }))
              }
              title="Hembra"
              className={`flex-1 flex items-center justify-center py-3 rounded-xl border transition-all cursor-pointer ${
                formData.gender === "hembra"
                  ? "bg-pink-500/20 border-pink-500 text-pink-400 shadow-sm shadow-pink-500/20"
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
              }`}
            >
              <Venus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
