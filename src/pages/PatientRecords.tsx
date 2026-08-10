// src/pages/PatientRecords.tsx
import { useState, useMemo } from "react";
import { PatientHeader } from "../components/patients/PatientHeader";
import { PatientSearchCard } from "../components/patients/PatientSearchCard";
import { PatientQuickAccess } from "../components/patients/PatientQuickAccess";
import { Footer } from "../components/common/Footer";
import { PatientCard } from "../components/patients/PatientCard";
import PatientProfileModal from "../components/patients/profile/PatientProfileModal";
import { RotateCcw } from "lucide-react";

interface PatientRecordsProps {
  patients: any[];
  appointments?: any[];
  onDeletePatient?: (id: string) => void; // <--- Añadido para recibir la función de borrado
}

type SpeciesKey = "perro" | "gato" | "exótico";
const SPECIES_OPTIONS: SpeciesKey[] = ["perro", "gato", "exótico"];

// Función auxiliar fuera del componente para evitar recrearla en cada render
const parseAppointmentTime = (app: any) => {
  const dateVal = app.date || app.fecha || app.createdAt || app.appointmentDate;
  if (!dateVal) return 0;

  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const [year, month, day] = dateVal.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const parsed = new Date(dateVal).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

export const PatientRecords = ({
  patients = [],
  appointments = [],
  onDeletePatient, // <--- Recibido por props
}: PatientRecordsProps) => {
  const [activeTab, setActiveTab] = useState<"patients" | "owners">("patients");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesKey[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>("all");

  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentPatients, setRecentPatients] = useState<string[]>([]);

  const handleOpenProfile = (patientId: string) => {
    const found = patients.find((p) => p.id === patientId);
    if (found) {
      setSelectedPatient(found);
      setIsModalOpen(true);

      setRecentPatients((prev) => {
        const filtered = prev.filter((name) => name !== found.name);
        return [found.name, ...filtered].slice(0, 5);
      });
    }
  };

  const handleCloseProfile = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleDeleteConsultation = (
    patientId: string,
    consultationIndex: number,
  ) => {
    setSelectedPatient((prev: any) => {
      if (!prev || prev.id !== patientId) return prev;
      const updatedHistory = (prev.history || []).filter(
        (_: any, idx: number) => idx !== consultationIndex,
      );
      return {
        ...prev,
        history: updatedHistory,
      };
    });
  };

  // Función para manejar la eliminación completa desde el modal y cerrar la ventana
  const handleDeleteFullPatient = (patientId: string) => {
    if (onDeletePatient) {
      onDeletePatient(patientId);
    }
    handleCloseProfile();
  };

  const handleNewRecord = () => {};

  const handleSelectShortcut = (patientName: string) => {
    setSearchQuery(patientName);
  };

  const isAllSpeciesSelected = selectedSpecies.length === 0;

  const handleSelectSpecies = (species: SpeciesKey) => {
    setSelectedSpecies((prev) => {
      if (prev.includes(species)) {
        return prev.filter((s) => s !== species);
      } else {
        return [...prev, species];
      }
    });
  };

  const handleSelectAllSpecies = () => {
    setSelectedSpecies([]);
  };

  // Optimización: Enriquecemos los pacientes con su última visita usando useMemo
  const patientsWithLastVisit = useMemo(() => {
    return patients.map((patient) => {
      const pId = String(patient.id || "").trim();
      const pName = String(patient.name || "")
        .toLowerCase()
        .trim();

      const patientAppointments = appointments.filter((app) => {
        const aId = String(
          app.patientId || app.patient_id || app.idPatient || "",
        ).trim();
        const aName = String(
          app.patientName || app.petName || app.name || app.paciente || "",
        )
          .toLowerCase()
          .trim();

        return (aId !== "" && aId === pId) || (aName !== "" && aName === pName);
      });

      const sortedAppointments = [...patientAppointments].sort(
        (a, b) => parseAppointmentTime(b) - parseAppointmentTime(a),
      );

      const lastAppointment = sortedAppointments[0];
      const rawDate =
        lastAppointment?.date ||
        lastAppointment?.fecha ||
        lastAppointment?.createdAt ||
        lastAppointment?.appointmentDate;

      let formattedLastVisit = undefined;
      if (rawDate) {
        if (
          typeof rawDate === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ) {
          const [year, month, day] = rawDate.split("-");
          formattedLastVisit = `${day}/${month}/${year}`;
        } else {
          const dateObj = new Date(rawDate);
          if (!isNaN(dateObj.getTime())) {
            formattedLastVisit = dateObj.toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          } else {
            formattedLastVisit = String(rawDate);
          }
        }
      }

      return {
        ...patient,
        lastVisit: formattedLastVisit,
      };
    });
  }, [patients, appointments]);

  // Filtrado optimizado sobre la lista ya enriquecida
  const filteredPatients = useMemo(() => {
    return patientsWithLastVisit.filter((patient) => {
      if (!isAllSpeciesSelected) {
        const speciesLower = patient.species?.toLowerCase() || "";

        const matchesAnySelectedSpecies = selectedSpecies.some((s) => {
          if (s === "exótico") {
            return (
              speciesLower.includes("exótico") ||
              speciesLower.includes("exotico") ||
              speciesLower.includes("ave") ||
              speciesLower.includes("conejo") ||
              speciesLower.includes("otro")
            );
          }
          return speciesLower.includes(s);
        });

        if (!matchesAnySelectedSpecies) return false;
      }

      if (selectedGender !== "all") {
        const genderLower = patient.gender?.toLowerCase() || "";
        if (!genderLower.includes(selectedGender.toLowerCase())) return false;
      }

      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();

      return (
        patient.name?.toLowerCase().includes(query) ||
        patient.species?.toLowerCase().includes(query) ||
        patient.breed?.toLowerCase().includes(query) ||
        patient.gender?.toLowerCase().includes(query) ||
        patient.age?.toLowerCase().includes(query) ||
        patient.ownerName?.toLowerCase().includes(query) ||
        patient.ownerPhone?.toLowerCase().includes(query) ||
        patient.microchip?.toLowerCase().includes(query)
      );
    });
  }, [
    patientsWithLastVisit,
    selectedSpecies,
    selectedGender,
    searchQuery,
    isAllSpeciesSelected,
  ]);

  const hasActiveFilters =
    selectedSpecies.length > 0 ||
    selectedGender !== "all" ||
    searchQuery !== "";

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
      <div className="space-y-6 pb-6">
        <PatientHeader onNewRecord={handleNewRecord} />

        <div className="space-y-4">
          <PatientSearchCard
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            searchQuery={searchQuery}
            onChangeSearch={(q) => setSearchQuery(q)}
          />

          {/* Barra de Filtros Rápidos Optimizada */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:px-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            {/* Sección Izquierda: Especies */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Especie:
              </span>
              <button
                type="button"
                onClick={handleSelectAllSpecies}
                className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                  isAllSpeciesSelected
                    ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-sm shadow-[#ece883]/20"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                Todas
              </button>

              {SPECIES_OPTIONS.map((speciesKey) => {
                const isSelected = selectedSpecies.includes(speciesKey);
                const label =
                  speciesKey === "perro"
                    ? "🐶 Perros"
                    : speciesKey === "gato"
                      ? "🐱 Gatos"
                      : "⭐ Exóticos";

                return (
                  <button
                    key={speciesKey}
                    type="button"
                    onClick={() => handleSelectSpecies(speciesKey)}
                    className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-medium flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-sm shadow-[#ece883]/20"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Separador visual sutil para escritorio */}
            <div className="hidden lg:block h-6 w-px bg-slate-800" />

            {/* Sección Derecha: Género y Botón Limpiar */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Sexo:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGender("all")}
                  className={`text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                    selectedGender === "all"
                      ? "bg-slate-800 text-slate-200 border-slate-700"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  Ambos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender("macho")}
                  className={`text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                    selectedGender === "macho"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-500/10"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  ♂️ Macho
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGender("hembra")}
                  className={`text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                    selectedGender === "hembra"
                      ? "bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm shadow-pink-500/10"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  ♀️ Hembra
                </button>
              </div>

              {/* Botón de limpiar filtros */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpecies([]);
                    setSelectedGender("all");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-slate-950 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all cursor-pointer font-medium ml-auto lg:ml-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-1">
            <PatientQuickAccess
              onSelectShortcut={handleSelectShortcut}
              recentPatients={recentPatients}
            />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
                  Directorio de Fichas de Pacientes
                </h3>
                <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  {filteredPatients.length}{" "}
                  {filteredPatients.length === 1 ? "registro" : "registros"}
                </span>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm italic">
                  No se encontraron fichas de pacientes que coincidan con los
                  filtros de búsqueda.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredPatients.map((patient, index) => (
                    <PatientCard
                      key={patient.id || index}
                      patient={patient}
                      onOpenProfile={handleOpenProfile}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <PatientProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseProfile}
        patient={selectedPatient}
        onDeleteConsultation={handleDeleteConsultation}
        onDeletePatient={handleDeleteFullPatient} // <--- Conectado aquí para borrar la ficha completa
      />
    </div>
  );
};

export default PatientRecords;
