import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GreetingBanner from "../components/common/GreetingBanner";
import { useAppointments } from "../hooks/useAppointments";
import { usePatients } from "../hooks/usePatients";
import type { Appointment } from "../types/appointment";
import type { Patient, Owner } from "../types/patient";

// Importación de los componentes modulares
import { OperationalSummary } from "../components/dashboard/OperationalSummary";
import { NextPatientCard } from "../components/dashboard/NextPatientCard";
import { StockAlertCard } from "../components/dashboard/StockAlertCard";
import { QuickAccessBar } from "../components/dashboard/QuickAccessBar";
import { ConsultationModal } from "../components/schedule/ConsultationModal/ConsultationModal";

// ============================================
// TIPOS PARA LOS HANDLERS
// ============================================
interface ConsultationData {
  patient: Patient;
  owner: Owner;
  appointment: Appointment;
  notes: string;
  weight?: number;
  recommendations?: string;
  shouldFinish: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();

  // Consumir hooks directamente
  const { totalCitasHoy, proximoPaciente, updateStatus } = useAppointments();
  const { getPatient, getOwner, addMedicalRecord } = usePatients();

  // Estados para controlar el modal de consulta
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  // TODO: Estos datos deberían venir de hooks específicos
  // Por ahora los dejamos como placeholders
  const totalTareasPendientes = 5;
  const totalAlertasActivas = 4;

  const alertaStockCritico = {
    medicamento: "Meloxicam 2 mg (Gotas)",
    stockActual: 2,
    stockMinimo: 10,
    unidad: "frascos",
  };

  // ============================================
  // HANDLERS TIPADOS
  // ============================================

  /**
   * Abre el modal de consulta cuando el usuario hace click en "Iniciar Consulta"
   */
  const handleStartConsultation = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsConsultationOpen(true);
  };

  /**
   * Guarda los datos de la consulta desde el modal
   * Orquesta: guardar historial médico + actualizar estado de la cita
   */
  const handleSaveConsultation = (consultationData: ConsultationData) => {
    const { patient, notes, weight, recommendations, shouldFinish } =
      consultationData;

    // 1. Agregar registro al historial médico del paciente
    addMedicalRecord(patient.id, {
      date: new Date().toISOString(),
      notes,
      weight,
      recommendations,
    });

    // 2. Actualizar estado de la cita si corresponde
    if (shouldFinish) {
      updateStatus(consultationData.appointment.id, "finalizada");
    } else {
      updateStatus(consultationData.appointment.id, "en_consulta");
    }

    // 3. Cerrar el modal
    setIsConsultationOpen(false);
    setSelectedAppointment(null);
  };

  /**
   * Cierra el modal sin guardar cambios
   */
  const handleCloseConsultation = () => {
    setIsConsultationOpen(false);
    setSelectedAppointment(null);
  };

  // ============================================
  // DATOS DERIVADOS PARA EL MODAL
  // ============================================

  // Cuando abrimos el modal, necesitamos el patient y owner completos
  const modalPatient = selectedAppointment
    ? getPatient(selectedAppointment.patientId)
    : null;
  const modalOwner = modalPatient ? getOwner(modalPatient.ownerId) : null;

  return (
    <div className="flex flex-col min-h-full w-full mx-auto">
      {/* Contenido principal optimizado para ancho completo */}
      <div className="space-y-6 pb-6">
        {/* 1. Saludo dinámico (ya no recibe props, usa useAuth internamente) */}
        <div className="[&>div]:py-3.5">
          <GreetingBanner />
        </div>

        {/* 2. Resumen Operativo */}
        <OperationalSummary
          citas={totalCitasHoy}
          tareas={totalTareasPendientes}
          alertas={totalAlertasActivas}
          onNavigate={navigate}
        />

        {/* 3. Sección Central: Próximo Paciente & Alerta de Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proximoPaciente ? (
            <NextPatientCard
              appointment={proximoPaciente}
              onNavigate={navigate}
              onStartConsultation={handleStartConsultation}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 flex items-center justify-center text-slate-400 text-sm">
              No hay próximos pacientes programados para hoy.
            </div>
          )}
          <StockAlertCard alerta={alertaStockCritico} onNavigate={navigate} />
        </div>

        {/* 4. Barra de Accesos Rápidos */}
        <QuickAccessBar onNavigate={navigate} />
      </div>

      {/* Modal de consulta médica */}
      {selectedAppointment && modalPatient && modalOwner && (
        <ConsultationModal
          isOpen={isConsultationOpen}
          onClose={handleCloseConsultation}
          appointment={selectedAppointment}
          patient={modalPatient}
          owner={modalOwner}
          onSaveConsultation={handleSaveConsultation}
        />
      )}
    </div>
  );
};

export default Dashboard;
