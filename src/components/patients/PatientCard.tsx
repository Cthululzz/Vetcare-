// src/components/patients/PatientCard.tsx
import type { Patient } from "../../types/patient";
import { Cat, Dog, Heart, Calendar } from "lucide-react";

interface PatientCardProps {
  patient: Patient & { lastVisit?: string };
  onOpenProfile: (patientId: string) => void;
}

export const PatientCard = ({ patient, onOpenProfile }: PatientCardProps) => {
  // Determinar si es hembra para el color del icono
  const genderLower = patient.gender?.toLowerCase() || "";
  const isFemale = genderLower.includes("hembra");

  // Color dinámico según género
  const iconColorClass = isFemale ? "text-pink-400" : "text-blue-400";
  const badgeBgClass = isFemale
    ? "bg-pink-500/10 border-pink-500/20"
    : "bg-blue-500/10 border-blue-500/20";

  const renderSpeciesIcon = () => {
    const speciesLower = patient.species?.toLowerCase() || "";
    if (speciesLower.includes("gato") || speciesLower.includes("felino")) {
      return <Cat className={`w-7 h-7 ${iconColorClass}`} />;
    }
    return <Dog className={`w-7 h-7 ${iconColorClass}`} />;
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="relative pr-24 min-h-[64px]">
          <div className="space-y-1">
            <h4 className="font-extrabold text-white text-lg tracking-tight leading-snug">
              {patient.name}
            </h4>
            <p className="text-xs text-slate-400 font-medium">{patient.age}</p>
            {patient.breed && (
              <p className="text-xs font-bold text-slate-200 tracking-wide truncate max-w-[180px]">
                {patient.breed}
              </p>
            )}
          </div>

          <div className="absolute top-0 right-0">
            <div
              className={`inline-flex items-center justify-center p-3 rounded-2xl border shadow-inner ${badgeBgClass}`}
            >
              {renderSpeciesIcon()}
            </div>
          </div>
        </div>

        {/* Sección de propietario */}
        <div className="border-t border-slate-800/80 pt-3 space-y-1.5">
          <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-slate-500" />
            Propietario:{" "}
            <span className="text-white font-semibold">
              {patient.ownerName}
            </span>
          </p>
          <p className="text-xs text-slate-400 pl-6">📞 {patient.ownerPhone}</p>
        </div>

        {/* Indicador de última visita (siempre visible como acceso rápido) */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#ece883]" />
            Última cita:
          </span>
          <span
            className={`font-medium ${patient.lastVisit ? "text-[#ece883]" : "text-slate-500 italic"}`}
          >
            {patient.lastVisit || "Sin registros previos"}
          </span>
        </div>
      </div>

      {/* Botón de acción inferior */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 relative z-10 flex justify-end">
        <button
          type="button"
          onClick={() => onOpenProfile(patient.id)}
          className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold transition-all cursor-pointer border border-slate-800 shadow-sm hover:border-slate-700"
        >
          Ver ficha médica
        </button>
      </div>
    </div>
  );
};
