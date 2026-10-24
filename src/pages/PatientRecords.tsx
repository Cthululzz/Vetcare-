import { useState, useMemo } from "react";
import { PatientHeader } from "../components/patients/PatientHeader";
import { PatientSearchCard } from "../components/patients/PatientSearchCard";
import { PatientQuickAccess } from "../components/patients/PatientQuickAccess";
import { Footer } from "../components/common/Footer";
import { PatientCard } from "../components/patients/PatientCard";
import PatientProfileModal from "../components/patients/profile/PatientProfileModal";
import { RotateCcw } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { useAppointments } from "../hooks/useAppointments";
import type { Patient } from "../types/patient";
import type { EspecieMascota, Genero } from "../constants/appConstants";
import { formatDateShort } from "../utils/dateUtils";

// ============================================
// TIPOS INTERNOS
// ============================================
type TabType = "patients" | "owners";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const PatientRecords = () => {
  // Consumir hooks directamente (sin props drilling)
  const {
    getPatient,
    getOwner,
    getActivePatients,
    deletePatient,
    updatePatient,
  } = usePatients();

  const { getAppointmentsByPatient } = useAppointments();

  // ============================================
  // ESTADOS
  // ============================================
  const [activeTab, setActiveTab] = useState<TabType>("patients");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSpecies, setSelectedSpecies] = useState<EspecieMascota[]>([]);
  const [selectedGender, setSelectedGender] = useState<Genero | "all">("all");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guardar IDs de pacientes recientes (no nombres)
  const [recentPatientIds, setRecentPatientIds] = useState<string[]>([]);

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  // Obtener nombres de pacientes recientes para el componente PatientQuickAccess
  const recentPatientNames = useMemo(() => {
    return recentPatientIds
      .map((id) => getPatient(id))
      .filter((p): p is Patient => p !== undefined)
      .map((p) => p.name);
  }, [recentPatientIds, getPatient]);

  // Enriquecer pacientes con su última visita
  const patientsWithLastVisit = useMemo(() => {
    const activePatients = getActivePatients();

    return activePatients.map((patient) => {
      // Obtener citas del paciente (ahora es simple: por ID)
      const patientAppointments = getAppointmentsByPatient(patient.id);

      // Ordenar por fecha (descendente) y tomar la más reciente
      const sortedAppointments = [...patientAppointments].sort((a, b) =>
        b.fecha.localeCompare(a.fecha),
      );

      const lastAppointment = sortedAppointments[0];
      const lastVisit = lastAppointment
        ? formatDateShort(lastAppointment.fecha)
        : undefined;

      return {
        ...patient,
        lastVisit,
      };
    });
  }, [getActivePatients, getAppointmentsByPatient]);

  // Filtrado usando la función del hook
  const filteredPatients = useMemo(() => {
    let result = patientsWithLastVisit;

    // Filtrar por especie
    if (selectedSpecies.length > 0) {
      result = result.filter((p) => selectedSpecies.includes(p.species));
    }

    // Filtrar por género
    if (selectedGender !== "all") {
      result = result.filter((p) => p.gender === selectedGender);
    }

    // Filtrar por query de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((patient) => {
        const owner = getOwner(patient.ownerId);
        return (
          patient.name.toLowerCase().includes(query) ||
          patient.breed?.toLowerCase().includes(query) ||
          patient.microchip?.toLowerCase().includes(query) ||
          owner?.name.toLowerCase().includes(query) ||
          owner?.phone.toLowerCase().includes(query) ||
          owner?.email?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [
    patientsWithLastVisit,
    selectedSpecies,
    selectedGender,
    searchQuery,
    getOwner,
  ]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenProfile = (patientId: string) => {
    const patient = getPatient(patientId);
    if (patient) {
      setSelectedPatient(patient);
      setIsModalOpen(true);

      // Actualizar lista de recientes (guardar ID, no nombre)
      setRecentPatientIds((prev) => {
        const filtered = prev.filter((id) => id !== patientId);
        return [patientId, ...filtered].slice(0, 5);
      });
    }
  };

  const handleCloseProfile = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleDeleteMedicalRecord = (patientId: string, recordId: string) => {
    const patient = getPatient(patientId);
    if (!patient) return;

    const updatedHistory = patient.history.filter((r) => r.id !== recordId);

    // Actualizar el paciente con el historial modificado
    updatePatient(patientId, { history: updatedHistory });

    // Actualizar el selectedPatient si está abierto
    if (selectedPatient?.id === patientId) {
      setSelectedPatient({ ...patient, history: updatedHistory });
    }
  };

  const handleDeleteFullPatient = (patientId: string) => {
    deletePatient(patientId);
    handleCloseProfile();
  };

  const handleNewRecord = () => {
    // TODO: Implementar creación de nuevo registro
    console.log("Crear nuevo registro");
  };

  const handleSelectShortcut = (patientName: string) => {
    setSearchQuery(patientName);
  };

  const handleSelectSpecies = (species: EspecieMascota) => {
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

  // ============================================
  // CONSTANTES
  // ============================================
  const isAllSpeciesSelected = selectedSpecies.length === 0;

  const hasActiveFilters =
    selectedSpecies.length > 0 ||
    selectedGender !== "all" ||
    searchQuery !== "";

  const SPECIES_OPTIONS: {
    key: EspecieMascota;
    label: string;
    icon: string;
  }[] = [
    { key: "perro", label: "Perros", icon: "🐶" },
    { key: "gato", label: "Gatos", icon: "🐱" },
    { key: "exoticos", label: "Exóticos", icon: "⭐" },
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
      <div className="space-y-6 pb-6">
        <PatientHeader onNewRecord={handleNewRecord} />

        <div className="space-y-4">
          <PatientSearchCard
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
          />

          {/* Barra de Filtros Rápidos */}
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

              {SPECIES_OPTIONS.map(({ key, label, icon }) => {
                const isSelected = selectedSpecies.includes(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectSpecies(key)}
                    className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-medium flex items-center gap-2 ${
                      isSelected
                        ? "bg-[#ece883] text-slate-950 border-[#ece883] shadow-sm shadow-[#ece883]/20"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
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
              recentPatients={recentPatientNames}
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
                  {filteredPatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
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

      {selectedPatient && (
        <PatientProfileModal
          isOpen={isModalOpen}
          onClose={handleCloseProfile}
          patient={selectedPatient}
          owner={getOwner(selectedPatient.ownerId)}
          onDeleteMedicalRecord={handleDeleteMedicalRecord}
          onDeletePatient={handleDeleteFullPatient}
        />
      )}
    </div>
  );
};

export default PatientRecords;
