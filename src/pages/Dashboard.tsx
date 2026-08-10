// src/pages/Dashboard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GreetingBanner from "../components/common/GreetingBanner";
import { Footer } from "../components/common/Footer";
import { useAppointments } from "../hooks/useAppointments";

// Importación de los componentes modulares
import { OperationalSummary } from "../components/dashboard/OperationalSummary";
import { NextPatientCard } from "../components/dashboard/NextPatientCard";
import { StockAlertCard } from "../components/dashboard/StockAlertCard";
import { QuickAccessBar } from "../components/dashboard/QuickAccessBar";
import { ConsultationModal } from "../components/schedule/ConsultationModal/ConsultationModal"; // Importamos el modal

const Dashboard = () => {
  const navigate = useNavigate();

  // Obtenemos los datos sincronizados desde el hook
  const { totalCitasHoy, proximoPaciente } = useAppointments();

  // Estados para controlar el modal de consulta
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const totalTareasPendientes = 5;
  const totalAlertasActivas = 4;

  const alertaStockCritico = {
    medicamento: "Meloxicam 2 mg (Gotas)",
    stockActual: 2,
    stockMinimo: 10,
    unidad: "frascos",
  };

  // Función para abrir el modal al hacer clic en "Iniciar Consulta"
  const handleStartConsultation = (paciente: any) => {
    setSelectedAppointment(paciente);
    setIsConsultationOpen(true);
  };

  // Función para guardar los cambios de la consulta desde el modal
  const handleSaveConsultation = (updatedData: any, shouldFinish?: boolean) => {
    console.log(
      "Guardando datos de consulta:",
      updatedData,
      "Finalizada:",
      shouldFinish,
    );
    // Aquí puedes agregar la lógica para actualizar tu estado global, base de datos o hook
    setIsConsultationOpen(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      {/* Contenido principal optimizado para ancho completo */}
      <div className="space-y-6 pb-6">
        {/* 1. Saludo dinámico */}
        <div className="[&>div]:py-3.5">
          <GreetingBanner nombreDoctor="Dr. Silva" />
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
              paciente={proximoPaciente}
              onNavigate={navigate}
              onStartConsultation={handleStartConsultation} // Conectado al modal
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

      {/* Modal de consulta médica sincronizado */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        cita={selectedAppointment}
        onSaveConsultation={handleSaveConsultation}
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
