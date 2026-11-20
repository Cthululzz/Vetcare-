import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction, FocusEvent } from "react";
import { Check, ChevronDown, Dna, Heart, Mars, Plus, Venus } from "lucide-react";
import {
  ESPECIES_MASCOTA,
  getEspecieLabel,
} from "../../../constants/appConstants";
import { NEW_PATIENT_OPTION } from "../../../utils/patientSelection";
import type { AppointmentFormData } from "./AppointmentForm";

interface PacienteOption {
  id: string;
  label: string;
}

interface PetInfoSectionProps {
  formData: AppointmentFormData;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  setFormData: Dispatch<SetStateAction<AppointmentFormData>>;
  /** Sólo las mascotas del dueño reconocido. */
  opcionesPacientes: PacienteOption[];
  seleccionPaciente: string;
  onSelectPatient: (value: string) => void;
  /** Verdadero cuando el nombre escrito corresponde a un cliente registrado. */
  mostrarDesplegable: boolean;
}

export const PetInfoSection = ({
  formData,
  onChange,
  setFormData,
  opcionesPacientes,
  seleccionPaciente,
  onSelectPatient,
  mostrarDesplegable,
}: PetInfoSectionProps) => {
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  const selectClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-4 text-sm text-white focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  const abrirDesplegable = () => {
    if (mostrarDesplegable) setDesplegableAbierto(true);
  };

  const manejarBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDesplegableAbierto(false);
    }
  };

  const elegir = (value: string) => {
    onSelectPatient(value);
    setDesplegableAbierto(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3.5">
      {/* Nombre del Paciente: campo + desplegable del dueño reconocido */}
      <div className="relative" onBlur={manejarBlur}>
        <label
          htmlFor="paciente-nombre"
          className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
        >
          Nombre del Paciente
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Heart className="w-4 h-4" />
          </span>
          <input
            ref={inputRef}
            id="paciente-nombre"
            type="text"
            name="patientName"
            required
            autoComplete="off"
            value={formData.patientName}
            onChange={onChange}
            onFocus={abrirDesplegable}
            onClick={abrirDesplegable}
            placeholder="Ej. Max"
            className={`${fieldClassName} ${mostrarDesplegable ? "pr-10" : ""}`}
          />
          {mostrarDesplegable && (
            <button
              type="button"
              aria-label="Ver mascotas registradas"
              onClick={() => setDesplegableAbierto((abierto) => !abierto)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#ece883] cursor-pointer"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${desplegableAbierto ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {mostrarDesplegable && desplegableAbierto && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
            {opcionesPacientes.length > 0 && (
              <>
                <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Mascotas registradas
                </p>
                {opcionesPacientes.map((paciente) => {
                  const activo = paciente.id === seleccionPaciente;
                  return (
                    <button
                      key={paciente.id}
                      type="button"
                      onClick={() => elegir(paciente.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                        activo
                          ? "bg-[#ece883]/10 text-[#ece883]"
                          : "text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${activo ? "opacity-100" : "opacity-0"}`}
                      />
                      <span className="min-w-0 truncate">{paciente.label}</span>
                    </button>
                  );
                })}
              </>
            )}

            <div className="my-1 border-t border-slate-800" />
            <button
              type="button"
              onClick={() => elegir(NEW_PATIENT_OPTION)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
                seleccionPaciente === NEW_PATIENT_OPTION
                  ? "bg-[#ece883]/10 text-[#ece883]"
                  : "text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Registrar nuevo paciente</span>
            </button>
          </div>
        )}
      </div>

      {/* Raza */}
      <div>
        <label
          htmlFor="paciente-raza"
          className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
        >
          Raza
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Dna className="w-4 h-4" />
          </span>
          <input
            id="paciente-raza"
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
          <label
            htmlFor="paciente-especie"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Especie
          </label>
          <select
            id="paciente-especie"
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
          <span
            id="paciente-genero-label"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Género
          </span>
          <div
            className="flex gap-2"
            role="group"
            aria-labelledby="paciente-genero-label"
          >
            <button
              type="button"
              aria-label="Macho"
              aria-pressed={formData.gender === "macho"}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  gender: "macho",
                  patientId: undefined,
                  createNewPatient: true,
                }))
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
              aria-label="Hembra"
              aria-pressed={formData.gender === "hembra"}
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  gender: "hembra",
                  patientId: undefined,
                  createNewPatient: true,
                }))
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
