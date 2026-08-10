// src/components/schedule/AppointmentForm/PetInfoSection.tsx
import {
  Dog,
  Cat,
  Star,
  Mars,
  Venus,
  AlertTriangle,
  PawPrint,
} from "lucide-react";

interface PetInfoSectionProps {
  formData: {
    paciente: string;
    tipoMascota: string;
    genero: string;
    alergiasNotas: string;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const PetInfoSection = ({
  formData,
  onChange,
  setFormData,
}: PetInfoSectionProps) => {
  // Clase unificada para mantener consistencia visual con el resto de inputs
  const fieldClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  return (
    <div>
      {/* Selector de Especie con Iconos */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Especie de la Mascota
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() =>
              setFormData((prev: any) => ({ ...prev, tipoMascota: "Perro" }))
            }
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.tipoMascota === "Perro"
                ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-md shadow-[#ece883]/10"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Dog className="w-4 h-4" /> Perro
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData((prev: any) => ({ ...prev, tipoMascota: "Gato" }))
            }
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.tipoMascota === "Gato"
                ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-md shadow-[#ece883]/10"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Cat className="w-4 h-4" /> Gato
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData((prev: any) => ({ ...prev, tipoMascota: "Exótico" }))
            }
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.tipoMascota === "Exótico"
                ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-md shadow-[#ece883]/10"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Star className="w-4 h-4" /> Otro/Exótico
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Nombre de la Mascota
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <PawPrint className="w-4 h-4" />
          </span>
          <input
            type="text"
            name="paciente"
            required
            value={formData.paciente}
            onChange={onChange}
            placeholder="Ej. Max"
            className={fieldClassName}
          />
        </div>

        {/* Botones de Género */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={() =>
              setFormData((prev: any) => ({ ...prev, genero: "Macho" }))
            }
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              formData.genero === "Macho"
                ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/20"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <Mars className="w-4 h-4 text-blue-400" />
            Macho
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData((prev: any) => ({ ...prev, genero: "Hembra" }))
            }
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              formData.genero === "Hembra"
                ? "bg-pink-500/20 border-pink-500 text-pink-400 shadow-sm shadow-pink-500/20"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <Venus className="w-4 h-4 text-pink-400" />
            Hembra
          </button>
        </div>
      </div>

      {/* Alergias o Avisos Importantes */}
      <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Alergias o Avisos Importantes
        </label>
        <div className="border border-slate-800 rounded-xl bg-slate-950 focus-within:border-[#ece883] focus-within:ring-1 focus-within:ring-[#ece883]/30 transition-all">
          <div className="flex items-start">
            <span className="pt-3.5 pl-3.5 text-slate-500 pointer-events-none">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <textarea
              name="alergiasNotas"
              rows={3}
              value={formData.alergiasNotas}
              onChange={onChange}
              placeholder="Ej. Alérgico a la penicilina, agresivo, delicado..."
              className="w-full bg-transparent py-3 pl-3 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
