import { BedDouble } from "lucide-react";
import type { Patient } from "../../../types/patient";
import { getPatientDisplayAge } from "../../../utils/dateUtils";
import { useHospitalizations } from "../../../hooks/useHospitalizations";
import { PetAvatar } from "../../common/PetAvatar";

interface PatientProfileHeaderProps {
  patient: Patient;
}

export const PatientProfileHeader = ({
  patient,
}: PatientProfileHeaderProps) => {
  const { isHospitalized } = useHospitalizations();
  const hospitalized = isHospitalized(patient.id);

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
        <PetAvatar
          species={patient.species}
          gender={patient.gender}
          size="lg"
          breed={patient.breed}
        />
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {patient.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {patient.gender === "hembra" ? "Hembra" : "Macho"}
            </span>
            {hospitalized && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <BedDouble className="w-3.5 h-3.5" />
                Hospitalizado
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-[#ece883]">{speciesLabel}</p>
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
