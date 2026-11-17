import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GreetingBanner from "../components/common/GreetingBanner";
import { Footer } from "../components/common/Footer";
import { useAppointments } from "../hooks/useAppointments";
import { useAppointmentReminders } from "../hooks/useAppointmentReminders";
import { useHospitalizations } from "../hooks/useHospitalizations";
import { usePatients } from "../hooks/usePatients";
import { OperationalSummary } from "../components/dashboard/OperationalSummary";
import { NextPatientCard } from "../components/dashboard/NextPatientCard";
import { StockAlertCard } from "../components/inventory/StockAlertCardImproved";
import { QuickAccessBar } from "../components/dashboard/QuickAccessBar";
import {
  buildHospitalizationTasks,
  hasTasksDueNow,
  splitHospitalizationTasks,
} from "../utils/hospitalizationTasks";
import {
  buildDueAppointmentReminders,
  hasDueAppointmentReminders,
} from "../utils/appointmentReminders";

const Dashboard = () => {
  const navigate = useNavigate();
  const { proximoPaciente, appointments } = useAppointments();
  const { hospitalizations } = useHospitalizations();
  const { getPatient, getOwner } = usePatients();
  const { sentReminders } = useAppointmentReminders();

  // Tareas = dosis/revisiones de las próximas 24 h + recordatorios de citas por enviar.
  // Alertas = dosis o revisiones ya vencidas.
  const { totalTareasPendientes, totalAlertasActivas, tareasParaAhora } =
    useMemo(() => {
      const tasks = buildHospitalizationTasks(hospitalizations, getPatient);
      const { pending, overdue } = splitHospitalizationTasks(tasks);
      const reminders = buildDueAppointmentReminders(
        appointments,
        sentReminders,
        getPatient,
        getOwner,
      );

      return {
        totalTareasPendientes: pending.length + reminders.length,
        totalAlertasActivas: overdue.length,
        // Solo hay que actuar ya si la hora de la tarea llegó. Excepción:
        // los recordatorios de cita (24 h / 1 h) se atienden antes de la hora.
        tareasParaAhora:
          hasDueAppointmentReminders(reminders) || hasTasksDueNow(tasks),
      };
    }, [hospitalizations, appointments, sentReminders, getPatient, getOwner]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6">
        <div className="[&>div]:py-3.5">
          <GreetingBanner />
        </div>

        <OperationalSummary
          tareas={totalTareasPendientes}
          alertas={totalAlertasActivas}
          tareasParaAhora={tareasParaAhora}
          onNavigate={navigate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proximoPaciente ? (
            <NextPatientCard
              appointment={proximoPaciente}
              onNavigate={navigate}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 flex items-center justify-center text-slate-400 text-sm min-h-[240px]">
              No hay próximos pacientes programados para hoy.
            </div>
          )}
          <StockAlertCard onNavigate={navigate} />
        </div>

        <QuickAccessBar onNavigate={navigate} />
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
