// src/components/patients/profile/PatientProfileModal.tsx
import { useState, useEffect, useRef } from "react";
import {
  X,
  Cat,
  Dog,
  Heart,
  Calendar,
  FileText,
  Weight,
  Stethoscope,
  Phone,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Edit2,
  Save,
} from "lucide-react";
import type { Patient } from "../../../types/patient";
import { usePatientProfiles } from "../../../hooks/usePatientProfiles";

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onDeleteConsultation?: (patientId: string, consultationIndex: number) => void;
  onDeletePatient?: (patientId: string) => void;
}

// Analizador de fechas ultra seguro y explícito
const parseAppointmentTime = (dateStr?: string) => {
  if (!dateStr) return 0;
  const cleanStr = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [year, month, day] = cleanStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0).getTime();
  }

  const parts = cleanStr.split("/");
  if (parts.length === 3) {
    const [p1, p2, p3] = parts.map(Number);
    if (p3 > 999) {
      return new Date(p3, p2 - 1, p1, 12, 0, 0).getTime();
    }
    if (p1 > 999) {
      return new Date(p1, p2 - 1, p3, 12, 0, 0).getTime();
    }
  }

  const parsed = new Date(cleanStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const formatDateToChilean = (dateStr?: string) => {
  if (!dateStr) return "Fecha no registrada";
  const cleanStr = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [year, month, day] = cleanStr.split("-");
    return `${day}/${month}/${year}`;
  }

  const parts = cleanStr.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const [p1, p2, p3] = parts;
    return `${p1.padStart(2, "0")}/${p2.padStart(2, "0")}/${p3}`;
  }

  return cleanStr;
};

const formatWeight = (weight?: string | number) => {
  if (weight === null || weight === undefined) return null;
  const cleanWeight = String(weight).trim();
  if (
    !cleanWeight ||
    cleanWeight.toLowerCase() === "kg" ||
    cleanWeight.toLowerCase() === "(kg)" ||
    cleanWeight === ""
  ) {
    return null;
  }
  return cleanWeight.replace(/kg/gi, "").trim();
};

export const PatientProfileModal = ({
  isOpen,
  onClose,
  patient,
  onDeleteConsultation,
  onDeletePatient,
}: PatientProfileModalProps) => {
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Hook de perfiles para las alergias/condiciones
  const { getProfile, saveProfile } = usePatientProfiles();

  const [isEditingConditions, setIsEditingConditions] = useState(false);
  const [condiciones, setCondiciones] = useState("");

  // Usamos un ref para rastrear el ID previo y evitar que un re-render por edición rompa el estado
  const prevPatientIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (patient && patient.id !== prevPatientIdRef.current) {
      const profile = getProfile(patient.name, patient.ownerName);
      setCondiciones(profile?.condicionesPrevias || "");
      setIsEditingConditions(false);
      prevPatientIdRef.current = patient.id;
    }
  }, [patient, getProfile]);

  if (!isOpen || !patient) return null;

  const profile = getProfile(patient.name, patient.ownerName);

  const genderLower = patient.gender?.toLowerCase() || "";
  const isFemale = genderLower.includes("hembra");
  const iconColorClass = isFemale ? "text-pink-400" : "text-blue-400";
  const badgeBgClass = isFemale
    ? "bg-pink-500/10 border-pink-500/20"
    : "bg-blue-500/10 border-blue-500/20";

  const renderSpeciesIcon = () => {
    const speciesLower = patient.species?.toLowerCase() || "";
    if (speciesLower.includes("gato") || speciesLower.includes("felino")) {
      return <Cat className={`w-8 h-8 ${iconColorClass}`} />;
    }
    return <Dog className={`w-8 h-8 ${iconColorClass}`} />;
  };

  const handleSaveConditions = () => {
    saveProfile(patient.name, patient.ownerName, condiciones, {
      edad: patient.age,
    });
    setIsEditingConditions(false);
  };

  // ORDENAMIENTO DE HISTORIAL
  const rawHistory = patient.history || [];
  const indexedHistory = rawHistory.map((entry, originalIndex) => ({
    ...entry,
    originalIndex,
  }));

  const sortedHistory = [...indexedHistory].sort((a, b) => {
    const timeA = parseAppointmentTime(a.date);
    const timeB = parseAppointmentTime(b.date);
    return timeB - timeA;
  });

  const latestConsultation = sortedHistory.length > 0 ? sortedHistory[0] : null;
  const pastHistory = sortedHistory.length > 1 ? sortedHistory.slice(1) : [];

  const handleDelete = (originalIndex: number) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este registro clínico?",
      )
    ) {
      if (onDeleteConsultation) {
        onDeleteConsultation(patient.id, originalIndex);
      }
    }
  };

  const handleFullPatientDelete = () => {
    if (
      window.confirm(
        `¿Estás absolutamente seguro de eliminar la ficha completa de "${patient.name}"? Esta acción no se puede deshacer y borrará todo su historial clínico.`,
      )
    ) {
      if (onDeletePatient) {
        onDeletePatient(patient.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 space-y-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#ece883]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABECERA DEL PERFIL */}
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
                  {patient.gender || "No especificado"}
                </span>
              </div>
              <p className="text-sm font-bold text-[#ece883]">
                {patient.species} {patient.breed ? `• ${patient.breed}` : ""}
              </p>
              <p className="text-xs text-slate-400">
                Edad:{" "}
                <span className="text-slate-200 font-medium">
                  {patient.age || "No registrada"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 SECCIÓN DE CONDICIONES PREVIAS / ALERGIAS */}
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Condiciones Previas / Alergias Críticas</span>
            </div>
            {!isEditingConditions ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingConditions(true);
                }}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCondiciones(profile?.condicionesPrevias || "");
                    setIsEditingConditions(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveConditions();
                  }}
                  className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-3 h-3" /> Guardar
                </button>
              </div>
            )}
          </div>

          {isEditingConditions ? (
            <textarea
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              rows={2}
              placeholder="Ej. Alérgico a la penicilina, condición cardíaca..."
              className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          ) : (
            <p className="text-xs text-slate-200 pl-6 leading-relaxed">
              {profile?.condicionesPrevias ? (
                profile.condicionesPrevias
              ) : (
                <span className="text-slate-500 italic">
                  Sin condiciones médicas registradas.
                </span>
              )}
            </p>
          )}
        </div>

        {/* SECCIÓN DE DATOS DEL PROPIETARIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Propietario</p>
              <p className="text-sm font-bold text-white">
                {patient.ownerName || "No registrado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <Phone className="w-5 h-5 text-[#ece883]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Teléfono de Contacto
              </p>
              <p className="text-sm font-bold text-white">
                {patient.ownerPhone || "No registrado"}
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE HISTORIAL CLÍNICO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#ece883]" />
              Historial Clínico
            </h3>
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              {sortedHistory.length}{" "}
              {sortedHistory.length === 1
                ? "registro total"
                : "registros totales"}
            </span>
          </div>

          {sortedHistory.length === 0 ? (
            <div className="bg-slate-950/30 border border-slate-800/60 rounded-2xl p-10 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-600 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-400">
                Aún no hay consultas finalizadas registradas para este paciente.
              </p>
              <p className="text-xs text-slate-500">
                Las notas aparecerán aquí automáticamente en cuanto finalices
                una consulta desde la agenda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ÚLTIMA CONSULTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Última Consulta Registrada
                  </p>
                  {latestConsultation && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(latestConsultation.originalIndex)
                      }
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                      title="Eliminar este registro erróneo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar registro</span>
                    </button>
                  )}
                </div>

                {latestConsultation && (
                  <div className="bg-slate-950/70 border border-[#ece883]/30 rounded-2xl p-5 space-y-3 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#ece883]/5 rounded-bl-full pointer-events-none" />

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                        <Calendar className="w-4 h-4 text-[#ece883]" />
                        <span>
                          {formatDateToChilean(latestConsultation.date)}
                        </span>
                        {latestConsultation.time && (
                          <span className="text-slate-400">
                            • 🕒 {latestConsultation.time}
                          </span>
                        )}
                      </div>
                      {formatWeight(latestConsultation.weight) ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-[#ece883]">
                          <Weight className="w-3.5 h-3.5" />
                          <span>
                            {formatWeight(latestConsultation.weight)} kg
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400">
                          <Weight className="w-3.5 h-3.5 text-slate-500" />
                          <span>No registrado kg</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Notas Clínicas / Diagnóstico:
                        </span>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {latestConsultation.notes || "Sin notas registradas."}
                        </p>
                      </div>

                      <div className="space-y-1 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/60">
                        <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Tratamiento / Recomendaciones:
                        </span>
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {latestConsultation.recommendations ||
                            "Sin recomendaciones adicionales."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MENÚ ACORDEÓN PARA HISTORIAL ANTERIOR */}
              {pastHistory.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs font-bold text-[#ece883] transition-colors cursor-pointer"
                  >
                    <span>Ver consultas anteriores ({pastHistory.length})</span>
                    {showFullHistory ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showFullHistory && (
                    <div className="space-y-3 mt-3 animate-fadeIn">
                      {pastHistory.map((entry) => (
                        <div
                          key={entry.originalIndex}
                          className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatDateToChilean(entry.date)}</span>
                              {entry.time && <span>• 🕒 {entry.time}</span>}
                            </div>

                            <div className="flex items-center gap-3">
                              {formatWeight(entry.weight) ? (
                                <span className="text-xs font-semibold text-slate-300">
                                  ⚖️ {formatWeight(entry.weight)} kg
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-500">
                                  ⚖️ No registrado kg
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(entry.originalIndex)
                                }
                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Eliminar este registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Notas:
                              </span>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {entry.notes || "Sin notas registradas."}
                              </p>
                            </div>

                            <div className="space-y-1 bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Recomendaciones:
                              </span>
                              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {entry.recommendations ||
                                  "Sin recomendaciones adicionales."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleFullPatientDelete}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
            title="Eliminar paciente y su expediente completo"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Eliminar ficha completa</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar ficha
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileModal;
