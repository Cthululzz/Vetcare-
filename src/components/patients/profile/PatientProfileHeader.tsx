import { Cat, Dog, Star } from "lucide-react";
import type { Patient } from "../../../types/patient";
import { getPatientDisplayAge } from "../../../utils/dateUtils";

interface PatientProfileHeaderProps {
  patient: Patient;
}

export const PatientProfileHeader = ({
  patient,
}: PatientProfileHeaderProps) => {
  const isFemale = patient.gender === "hembra";
  const iconColorClass = isFemale ? "text-pink-400" : "text-blue-400";
  const badgeBgClass = isFemale
    ? "bg-pink-500/10 border-pink-500/20"
    : "bg-blue-500/10 border-blue-500/20";

  const renderSpeciesIcon = () => {
    switch (patient.species) {
      case "gato":
        return <Cat className={`w-8 h-8 ${iconColorClass}`} />;
      case "perro":
        return <Dog className={`w-8 h-8 ${iconColorClass}`} />;
      case "exoticos":
        return <Star className={`w-8 h-8 ${iconColorClass}`} />;
      default:
        return <Dog className={`w-8 h-8 ${iconColorClass}`} />;
    }
  };

  const edadFormateada = getPatientDisplayAge(patient);

  const speciesLabels: Record<string, string> = {
    perro: "Perro",
    gato: "Gato",
    exoticos: "Exóticos / Otros",
  };

  const speciesLabel = speciesLabels[patient.species] || patient.species;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 pr-10">
      <div className="flex items-start gap-4">
        <div
          className={`p-4 rounded-2xl border shadow-inner ${badgeBgClass} shrink-0`}
        >
          {renderSpeciesIcon()}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {patient.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {patient.gender === "hembra" ? "Hembra" : "Macho"}
            </span>
          </div>
          <p className="text-sm font-bold text-[#ece883]">
            {speciesLabel} {patient.breed ? `• ${patient.breed}` : ""}
          </p>
          <p className="text-xs text-slate-400">
            Edad:{" "}
            <span className="text-slate-200 font-medium">{edadFormateada}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileHeader;
