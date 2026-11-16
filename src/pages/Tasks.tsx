import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BedDouble,
  CheckSquare,
  CheckCircle2,
  MessageCircle,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Footer } from "../components/common/Footer";
import { useAppointments } from "../hooks/useAppointments";
import { useAppointmentReminders } from "../hooks/useAppointmentReminders";
import { useHospitalizations } from "../hooks/useHospitalizations";
import { usePatients } from "../hooks/usePatients";
import {
  buildHospitalizationTaskGroups,
  type HospitalizationTask,
} from "../utils/hospitalizationTasks";
import {
  buildDueAppointmentReminders,
  type DueAppointmentReminder,
} from "../utils/appointmentReminders";
import {
  buildAppointmentReminderMessage,
  buildWhatsAppLink,
} from "../utils/whatsappUtils";
import { formatDateShort, formatDateTimeShort } from "../utils/dateUtils";
import { getDoctorName, getSucursalName } from "../constants/appConstants";

type TabType = "tareas" | "recordatorios" | "alertas";

const TABS: Array<{ id: TabType; label: string }> = [
  { id: "tareas", label: "Tareas pendientes" },
  { id: "recordatorios", label: "Recordatorios de citas" },
  { id: "alertas", label: "Alertas activas" },
];

const isTabType = (value: string | null): value is TabType =>
  value === "tareas" || value === "recordatorios" || value === "alertas";

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: TabType = isTabType(requestedTab) ? requestedTab : "tareas";

  const { hospitalizations, getActiveHospitalizations } = useHospitalizations();
  const { patients, getPatient, getOwner } = usePatients();
  const { appointments } = useAppointments();
  const { sentReminders, markAsSent } = useAppointmentReminders();

  const { pending, overdue } = useMemo(
    () => buildHospitalizationTaskGroups(hospitalizations, getPatient),
    [hospitalizations, getPatient],
  );

  const activeHospitalizations = getActiveHospitalizations();

  const reminders = useMemo(
    () =>
      buildDueAppointmentReminders(
        appointments,
        sentReminders,
        getPatient,
        getOwner,
      ),
    [appointments, sentReminders, getPatient, getOwner],
  );

  const counts: Record<TabType, number> = {
    tareas: pending.length,
    recordatorios: reminders.length,
    alertas: overdue.length,
  };

  const changeTab = (tab: TabType) => {
    setSearchParams(tab === "tareas" ? {} : { tab });
  };

  const sendReminder = (reminder: DueAppointmentReminder) => {
    if (!reminder.ownerPhone) return;

    const message = buildAppointmentReminderMessage({
      patientName: reminder.patientName,
      ownerName: reminder.ownerName,
      dateLabel: formatDateShort(reminder.appointment.fecha),
      timeLabel: reminder.appointment.hora,
      doctorName: getDoctorName(reminder.appointment.doctorId),
      sucursal: getSucursalName(reminder.appointment.sucursalId),
      kind: reminder.kind,
    });

    window.open(
      buildWhatsAppLink(reminder.ownerPhone, message),
      "_blank",
      "noopener,noreferrer",
    );
    markAsSent(reminder.appointment.id, reminder.kind);
  };

  const renderTask = (task: HospitalizationTask, overdueStyle: boolean) => (
    <div
      key={task.id}
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        overdueStyle
          ? "bg-red-500/5 border-red-500/20"
          : "bg-slate-950/60 border-slate-800"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`p-2 rounded-lg border shrink-0 ${
            task.type === "medicacion"
              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
              : "bg-[#ece883]/10 text-[#ece883] border-[#ece883]/20"
          }`}
        >
          {task.type === "medicacion" ? (
            <Pill className="w-4 h-4" />
          ) : (
            <Stethoscope className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{task.title}</p>
          <p className="text-xs text-slate-400">
            {task.patientName}
            {task.bed ? ` · ${task.bed}` : ""}
            {task.detail ? ` · ${task.detail}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-semibold ${
            overdueStyle ? "text-red-400" : "text-slate-400"
          }`}
        >
          {task.overdue ? "Venció: " : "Programado: "}
          {formatDateTimeShort(task.dueAt)}
        </span>
        <Link
          to="/pacientes/hospitalizados"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <BedDouble className="w-3.5 h-3.5" /> Ir
        </Link>
      </div>
    </div>
  );

  const renderReminder = (reminder: DueAppointmentReminder) => (
    <div
      key={`${reminder.appointment.id}-${reminder.kind}`}
      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-white">
            {reminder.patientName}
          </p>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
              reminder.kind === "1h"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-blue-500/10 text-blue-300 border-blue-500/30"
            }`}
          >
            Aviso {reminder.kind === "1h" ? "1 hora" : "24 horas"}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {reminder.ownerName} ·{" "}
          {formatDateShort(reminder.appointment.fecha)} a las{" "}
          {reminder.appointment.hora} ·{" "}
          {getDoctorName(reminder.appointment.doctorId)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => sendReminder(reminder)}
          disabled={!reminder.ownerPhone}
          title={
            reminder.ownerPhone
              ? "Abrir WhatsApp con el mensaje listo"
              : "El propietario no tiene teléfono registrado"
          }
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-emerald-300 border border-emerald-500/20 disabled:border-slate-800 text-xs font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Enviar
        </button>
        <button
          type="button"
          onClick={() =>
            markAsSent(reminder.appointment.id, reminder.kind)
          }
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Marcar enviado
        </button>
      </div>
    </div>
  );

  const emptyState = (message: string) => (
    <div className="text-center py-12">
      <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#ece883]" />
              Tareas y Alertas
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Dosis programadas, revisiones de pacientes hospitalizados y
              recordatorios de citas por enviar.
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => changeTab("tareas")}
            className={`text-left bg-slate-900 border rounded-2xl p-5 flex items-center gap-4 transition-colors cursor-pointer ${
              activeTab === "tareas"
                ? "border-emerald-500/40"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Tareas pendientes
              </p>
              <h3 className="text-xl font-bold text-white">{counts.tareas}</h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => changeTab("recordatorios")}
            className={`text-left bg-slate-900 border rounded-2xl p-5 flex items-center gap-4 transition-colors cursor-pointer ${
              activeTab === "recordatorios"
                ? "border-blue-500/40"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Recordatorios de citas
              </p>
              <h3 className="text-xl font-bold text-white">
                {counts.recordatorios}
              </h3>
            </div>
          </button>

          <button
            type="button"
            onClick={() => changeTab("alertas")}
            className={`text-left bg-slate-900 border rounded-2xl p-5 flex items-center gap-4 transition-colors cursor-pointer ${
              activeTab === "alertas"
                ? "border-[#ece883]/40"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="p-3 rounded-xl bg-amber-500/10 text-[#ece883] border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Alertas activas
              </p>
              <h3 className="text-xl font-bold text-white">{counts.alertas}</h3>
            </div>
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#ece883] text-slate-950"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/20 border border-current/20">
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {activeTab === "tareas" &&
            (pending.length === 0
              ? emptyState("No hay tareas clínicas para las próximas 24 horas.")
              : <div className="space-y-3">{pending.map((task) => renderTask(task, false))}</div>)}

          {activeTab === "recordatorios" && (
            <>
              <p className="text-xs text-slate-500">
                Se envían dos avisos al propietario: 24 horas y 1 hora antes de
                la cita. Los avisos ya enviados no se repiten.
              </p>
              {reminders.length === 0
                ? emptyState("No hay recordatorios de citas por enviar.")
                : (
                  <div className="space-y-3">
                    {reminders.map(renderReminder)}
                  </div>
                )}
            </>
          )}

          {activeTab === "alertas" &&
            (overdue.length === 0
              ? emptyState("No hay alertas clínicas activas.")
              : <div className="space-y-3">{overdue.map((task) => renderTask(task, true))}</div>)}
        </div>

        {activeHospitalizations.length > 0 && (
          <p className="text-xs text-slate-500">
            {activeHospitalizations.length}{" "}
            {activeHospitalizations.length === 1
              ? "paciente hospitalizado"
              : "pacientes hospitalizados"}{" "}
            ·{" "}
            <Link
              to="/pacientes/hospitalizados"
              className="text-[#ece883] hover:underline"
            >
              abrir área de hospitalización
            </Link>
          </p>
        )}

        {patients.length === 0 && (
          <p className="text-xs text-slate-500">
            Aún no hay pacientes registrados en el sistema.
          </p>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Tasks;
