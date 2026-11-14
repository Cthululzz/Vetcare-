import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Activity,
  Bell,
  ArrowLeft,
  Plus,
  CheckCircle,
  Stethoscope,
} from "lucide-react";
import { Footer } from "../components/common/Footer";
import { usePatients } from "../hooks/usePatients";
import { useHospitalizations } from "../hooks/useHospitalizations";
import {
  EvolutionFormModal,
  type EvolutionData,
} from "../components/hospitalization/EvolutionFormModal";
import { DischargeConfirmModal } from "../components/hospitalization/DischargeConfirmModal";
import type { Patient, Owner } from "../types/patient";
import type { Hospitalization } from "../types/hospitalization";

// ============================================
// TIPOS INTERNOS
// ============================================
interface HospitalizedPatientView {
  hospitalization: Hospitalization;
  patient: Patient;
  owner: Owner | undefined;
  bed: string;
  status: string;
  reason: string;
  admissionDate: string;
  nextReview: string;
}

// ============================================
// CONSTANTES
// ============================================
// TODO: Estos valores deberían venir de un sistema de gestión de camas real
const TOTAL_CAMAS = 10;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const HospitalizationView = () => {
  const navigate = useNavigate();

  const { getOwner, addMedicalRecord } = usePatients();
  const { getActiveHospitalizations, dischargePatient } = useHospitalizations();

  // Estados para modales
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedHospitalization, setSelectedHospitalization] =
    useState<Hospitalization | null>(null);

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  // Enriquecer hospitalizaciones activas con datos de paciente y owner
  const hospitalizedPatientsView = useMemo((): HospitalizedPatientView[] => {
    const active = getActiveHospitalizations();

    return active.map(({ hospitalization, patient }) => {
      const owner = getOwner(patient.ownerId);

      return {
        hospitalization,
        patient,
        owner,
        // TODO: Asignar cama real cuando tengamos sistema de camas
        bed: `Cama ${hospitalization.id.slice(0, 4).toUpperCase()}`,
        status: "En observación",
        reason: hospitalization.reason || "No especificado",
        admissionDate: hospitalization.admittedAt,
        nextReview: "Pendiente",
      };
    });
  }, [getActiveHospitalizations, getOwner]);

  // Estadísticas derivadas de datos reales
  const totalInternados = hospitalizedPatientsView.length;
  const revisionesPendientes = hospitalizedPatientsView.filter(
    (p) => p.nextReview === "Pendiente",
  ).length;
  const camasDisponibles = Math.max(0, TOTAL_CAMAS - totalInternados);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Abre el modal de registrar evolución
   */
  const handleRegistrarEvolucion = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowEvolutionModal(true);
  };

  /**
   * Guarda la evolución en el historial del paciente
   */
  const handleSaveEvolution = (
    patientId: string,
    evolutionData: EvolutionData,
  ) => {
    // Construir nota completa con todos los datos
    let notes = `EVOLUCIÓN HOSPITALIZACIÓN\n\n${evolutionData.notes}`;

    // Agregar signos vitales si existen
    const vitalSigns = [];
    if (evolutionData.temperature)
      vitalSigns.push(`Temperatura: ${evolutionData.temperature}°C`);
    if (evolutionData.heartRate)
      vitalSigns.push(`Frec. Cardíaca: ${evolutionData.heartRate} lpm`);
    if (evolutionData.respiratoryRate)
      vitalSigns.push(
        `Frec. Respiratoria: ${evolutionData.respiratoryRate} rpm`,
      );

    if (vitalSigns.length > 0) {
      notes += `\n\nSIGNOS VITALES\n${vitalSigns.join("\n")}`;
    }

    // Agregar cambios de tratamiento si existen
    if (evolutionData.treatmentChanges) {
      notes += `\n\nCAMBIOS EN TRATAMIENTO\n${evolutionData.treatmentChanges}`;
    }

    // Agregar observaciones de enfermería si existen
    if (evolutionData.nursingObservations) {
      notes += `\n\nOBSERVACIONES DE ENFERMERÍA\n${evolutionData.nursingObservations}`;
    }

    // Guardar en el historial del paciente
    addMedicalRecord(patientId, {
      date: new Date().toISOString(),
      notes,
      recommendations: "Continuar monitoreo según evolución",
    });

    // Cerrar modal
    setShowEvolutionModal(false);
    setSelectedPatient(null);
  };

  /**
   * Abre el modal de confirmar alta
   */
  const handleDarDeAlta = (
    hospitalization: Hospitalization,
    patient: Patient,
  ) => {
    setSelectedHospitalization(hospitalization);
    setSelectedPatient(patient);
    setShowDischargeModal(true);
  };

  /**
   * Confirma el alta del paciente
   */
  const handleConfirmDischarge = () => {
    if (!selectedHospitalization || !selectedPatient) return;

    // Dar de alta en hospitalización
    dischargePatient(selectedHospitalization.id);

    // Registrar en el historial clínico
    addMedicalRecord(selectedPatient.id, {
      date: new Date().toISOString(),
      notes:
        "ALTA MÉDICA - Fin de hospitalización\n\nEl paciente ha sido dado de alta del área de hospitalización.",
      recommendations:
        "Seguimiento ambulatorio según indicaciones médicas. Controlar evolución en domicilio.",
    });

    // Cerrar modal
    setShowDischargeModal(false);
    setSelectedHospitalization(null);
    setSelectedPatient(null);
  };

  /**
   * Abre el formulario para ingresar un nuevo paciente a hospitalización
   * TODO: Implementar formulario de admisión con selección de cama
   */
  const handleIngresarPaciente = () => {
    alert(
      "Función pendiente: Ingresar paciente a hospitalización\n\n" +
        "Debería abrir un formulario con:\n" +
        "- Selección de paciente existente o creación de nuevo\n" +
        "- Motivo de internación\n" +
        "- Asignación de cama\n" +
        "- Tratamiento inicial\n" +
        "- Frecuencia de monitoreo",
    );
  };

  // ============================================
  // UTILIDADES DE FORMATO
  // ============================================

  /**
   * Formatea fecha ISO a formato legible relativo
   */
  const formatRelativeDate = (dateStr?: string): string => {
    if (!dateStr) return "No registrado";

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) return "Hoy";
      if (diffHours === 1) return "Hace 1 hora";
      return `Hace ${diffHours} horas`;
    }
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**
   * Formatea la especie y raza para mostrar
   */
  const formatSpeciesAndBreed = (patient: Patient): string => {
    const speciesLabels: Record<string, string> = {
      perro: "Perro",
      gato: "Gato",
      exoticos: "Exótico",
    };

    const species = speciesLabels[patient.species] || patient.species;
    return patient.breed ? `${species} (${patient.breed})` : species;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => navigate("/pacientes")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#ece883] mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Hub de Pacientes
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <BedDouble className="w-8 h-8 text-[#ece883]" />
                Área de Hospitalización y Monitoreo
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Control activo de pacientes internados, tratamientos y signos
                vitales.
              </p>
            </div>

            <button
              onClick={handleIngresarPaciente}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-md shadow-[#ece883]/10 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Ingresar Paciente
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Pacientes Internados
              </p>
              <h3 className="text-xl font-bold text-white">
                {totalInternados}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Revisiones Pendientes
              </p>
              <h3 className="text-xl font-bold text-white">
                {revisionesPendientes}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Camas Disponibles
              </p>
              <h3 className="text-xl font-bold text-white">
                {camasDisponibles} / {TOTAL_CAMAS}
              </h3>
            </div>
          </div>
        </div>

        {/* Listado de Pacientes Hospitalizados */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Pacientes en Cuidado Activo
            </h2>
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              {totalInternados}{" "}
              {totalInternados === 1 ? "paciente" : "pacientes"}
            </span>
          </div>

          {hospitalizedPatientsView.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
              <p className="text-sm text-slate-400 mb-2 font-medium">
                No hay pacientes hospitalizados en este momento.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Puedes hospitalizar a un paciente desde el modal de consulta
                médica (botón "Hospitalizar") o manualmente con el botón
                "Ingresar Paciente".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hospitalizedPatientsView.map((item) => (
                <div
                  key={item.hospitalization.id}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {item.patient.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        {item.bed}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Propietario:{" "}
                      <span className="text-slate-200">
                        {item.owner?.name || "Sin propietario"}
                      </span>{" "}
                      ({formatSpeciesAndBreed(item.patient)})
                    </p>
                    <p className="text-sm text-slate-300 font-medium italic">
                      Motivo: "{item.reason}"
                    </p>
                    <p className="text-xs text-slate-500">
                      Ingreso: {formatRelativeDate(item.admissionDate)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <button
                      onClick={() => handleRegistrarEvolucion(item.patient)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" /> Registrar Evolución
                    </button>
                    <button
                      onClick={() =>
                        handleDarDeAlta(item.hospitalization, item.patient)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Dar de Alta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Modal de Registrar Evolución */}
      <EvolutionFormModal
        isOpen={showEvolutionModal}
        patient={selectedPatient}
        onSave={handleSaveEvolution}
        onClose={() => {
          setShowEvolutionModal(false);
          setSelectedPatient(null);
        }}
      />

      {/* Modal de Confirmar Alta */}
      <DischargeConfirmModal
        isOpen={showDischargeModal}
        patient={selectedPatient}
        onConfirm={handleConfirmDischarge}
        onCancel={() => {
          setShowDischargeModal(false);
          setSelectedHospitalization(null);
          setSelectedPatient(null);
        }}
      />
    </div>
  );
};

export default HospitalizationView;
