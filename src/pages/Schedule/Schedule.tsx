import { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, X, ChevronLeft } from "lucide-react";
import { AppointmentForm } from "../../components/schedule/AppointmentForm/AppointmentForm";
import { AppointmentCard } from "../../components/schedule/AppointmentCard";
import { MonthCalendarView } from "../../components/schedule/MonthCalendarView";
import { WeekView } from "../../components/schedule/WeekView";
import { ConsultationModal } from "../../components/schedule/ConsultationModal/ConsultationModal";
import {
  getLocalTodayStr,
  getWeekDays,
  formatDateLatam,
  sortAppointmentsByDateTime,
} from "../../utils/dateUtils";
import { useScheduleActions } from "./useScheduleActions";
import type { TabType } from "./types";

const Schedule = () => {
  const [activeTab, setActiveTab] = useState<TabType>("hoy");
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);

  const {
    appointments,
    deleteAppointment,
    isModalOpen,
    editingState,
    isConsultationModalOpen,
    selectedAppointmentForConsultation,
    selectedDayDetail,
    setSelectedDayDetail,
    modalPatient,
    modalOwner,
    handleOpenNew,
    handleOpenEdit,
    handleCloseModal,
    handleSaveAppointment,
    handleStartConsultation,
    handleSaveConsultation,
    handleHospitalize,
    handleCloseConsultation,
  } = useScheduleActions();

  const todayStr = getLocalTodayStr();

  const citasActivas = useMemo(
    () =>
      appointments.filter((c) => {
        // Si el toggle está activo, mostrar todas (incluyendo finalizadas)
        if (showCompleted) {
          return c.status !== "cancelada";
        }
        // Si no, solo mostrar activas
        return c.status !== "finalizada" && c.status !== "cancelada";
      }),
    [appointments, showCompleted],
  );

  const citasDeHoy = useMemo(
    () =>
      sortAppointmentsByDateTime(
        citasActivas.filter((c) => c.fecha === todayStr),
      ),
    [citasActivas, todayStr],
  );

  const weekDays = useMemo(() => getWeekDays(), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Citas Agendadas
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Gestión y control de todas las citas registradas en el sistema.
            </p>
          </div>

          {/* Toggle de citas finalizadas */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <span className="text-sm text-slate-300 font-medium whitespace-nowrap">
              Mostrar citas finalizadas
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ece883]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-700 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ece883] peer-checked:after:bg-white"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Vista de detalle de día seleccionado */}
      {selectedDayDetail ? (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:grid md:grid-cols-3 items-center gap-4">
            <div className="w-full flex justify-start">
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#ece883] hover:underline cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" /> Volver a la vista general
              </button>
            </div>

            <div className="w-full text-center">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {selectedDayDetail.title}
              </h2>
            </div>

            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenNew(selectedDayDetail.dateStr)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agendar para este día
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            {(() => {
              const dayAppointments = sortAppointmentsByDateTime(
                citasActivas.filter(
                  (c) => c.fecha === selectedDayDetail.dateStr,
                ),
              );
              return dayAppointments.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm text-slate-500 italic">
                    No hay citas registradas para este día.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayAppointments.map((cita) => (
                    <AppointmentCard
                      key={cita.id}
                      appointment={cita}
                      onEdit={handleOpenEdit}
                      onDelete={deleteAppointment}
                      onStartConsultation={handleStartConsultation}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
          {/* Tabs de vista */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl w-fit">
              {(["hoy", "semana", "mes"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer capitalize ${
                    activeTab === tab
                      ? "bg-[#ece883] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  {tab === "mes" ? "Mes (Calendario)" : tab}
                </button>
              ))}
            </div>

            {activeTab === "hoy" && (
              <button
                type="button"
                onClick={() => handleOpenNew(todayStr)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ece883] text-slate-950 font-bold text-sm hover:bg-[#e4df68] transition-all shadow-md shadow-[#ece883]/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agendar cita para hoy
              </button>
            )}
          </div>

          {/* Vista: Hoy */}
          {activeTab === "hoy" &&
            (citasDeHoy.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-white mb-1">
                  No hay citas agendadas para hoy
                </h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5">
                  No existen registros programados para la fecha actual (
                  {formatDateLatam(todayStr)}).
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenNew(todayStr)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Agendar cita para hoy
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {citasDeHoy.map((cita) => (
                  <AppointmentCard
                    key={cita.id}
                    appointment={cita}
                    onEdit={handleOpenEdit}
                    onDelete={deleteAppointment}
                    onStartConsultation={handleStartConsultation}
                  />
                ))}
              </div>
            ))}

          {/* Vista: Semana */}
          {activeTab === "semana" && (
            <WeekView
              weekDays={weekDays}
              appointments={citasActivas}
              onSelectDay={(dateStr, title) =>
                setSelectedDayDetail({ dateStr, title })
              }
            />
          )}

          {/* Vista: Mes */}
          {activeTab === "mes" && (
            <MonthCalendarView
              currentCalendarDate={currentCalendarDate}
              onPrevMonth={() =>
                setCurrentCalendarDate(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
              onNextMonth={() =>
                setCurrentCalendarDate(
                  (prev) =>
                    new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
              onGoToToday={() => setCurrentCalendarDate(new Date())}
              appointments={citasActivas}
              onSelectDay={(dateStr, title) =>
                setSelectedDayDetail({ dateStr, title })
              }
            />
          )}
        </>
      )}

      {/* Modal de creación/edición de cita */}
      {isModalOpen && editingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <AppointmentForm
              initialData={editingState.initialFormData}
              onSaveAppointment={handleSaveAppointment}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* Modal de consulta médica */}
      {selectedAppointmentForConsultation && modalPatient && modalOwner && (
        <ConsultationModal
          isOpen={isConsultationModalOpen}
          onClose={handleCloseConsultation}
          appointment={selectedAppointmentForConsultation}
          patient={modalPatient}
          owner={modalOwner}
          onSaveConsultation={handleSaveConsultation}
          onHospitalize={handleHospitalize}
        />
      )}
    </div>
  );
};

export default Schedule;
