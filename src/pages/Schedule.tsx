// src/pages/Schedule.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Calendar as CalendarIcon, X, ChevronLeft } from "lucide-react";
import { AppointmentForm } from "../components/schedule/AppointmentForm/AppointmentForm";
import { AppointmentCard } from "../components/schedule/AppointmentCard";
import { MonthCalendarView } from "../components/schedule/MonthCalendarView";
import { WeekView } from "../components/schedule/WeekView";
import { ConsultationModal } from "../components/schedule/ConsultationModal/ConsultationModal";
import {
  formatDateLatam,
  sortCitasByHour,
} from "../components/schedule/appointmentUtils";

interface ScheduleProps {
  citas: any[];
  onDeleteAppointment: (id: string) => void;
  onSaveAppointment: (appointmentData: any) => void;
  onSaveConsultation?: (updatedCita: any, shouldFinish?: boolean) => void;
}

export const Schedule = ({
  citas,
  onDeleteAppointment,
  onSaveAppointment,
  onSaveConsultation,
}: ScheduleProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"hoy" | "semana" | "mes">("hoy");
  const [editingAppointment, setEditingAppointment] = useState<any | null>(
    null,
  );

  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [selectedCitaForConsultation, setSelectedCitaForConsultation] =
    useState<any | null>(null);

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    title: string;
  } | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // Efecto para abrir automáticamente el modal si se recibe ?consultar=ID en la URL
  useEffect(() => {
    const consultarId = searchParams.get("consultar");
    if (consultarId && citas.length > 0) {
      const pacienteEncontrado = citas.find(
        (c) => String(c.id) === String(consultarId),
      );
      if (pacienteEncontrado) {
        setSelectedCitaForConsultation(pacienteEncontrado);
        setIsConsultationModalOpen(true);

        // Limpiamos el parámetro de la URL para que no se reabra al recargar
        searchParams.delete("consultar");
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, citas, setSearchParams]);

  const getLocalTodayStr = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Excluimos las citas finalizadas de la vista principal de la agenda
  const citasActivas = citas.filter((c) => c.status !== "finalizada");

  const todayStr = getLocalTodayStr();
  const citasDeHoy = sortCitasByHour(
    citasActivas.filter((c) => c.fecha === todayStr),
  );

  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const weekDays = [];
    const dayNames = [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo",
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        name: dayNames[i],
        dateStr: getLocalTodayStr(d),
      });
    }
    return weekDays;
  };

  const weekDays = getWeekDates();

  const handleOpenNew = (dateStr?: string, existingCita?: any) => {
    if (existingCita) {
      setEditingAppointment(existingCita);
    } else if (dateStr) {
      setEditingAppointment({ fecha: dateStr });
    } else {
      setEditingAppointment({ fecha: todayStr });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cita: any) => {
    handleOpenNew(undefined, cita);
  };

  const handleSaveWrapper = (data: any) => {
    if (editingAppointment && editingAppointment.id) {
      onSaveAppointment({ ...data, id: editingAppointment.id });
    } else {
      onSaveAppointment(data);
    }
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  const handleStartConsultation = (cita: any) => {
    setSelectedCitaForConsultation(cita);
    setIsConsultationModalOpen(true);
  };

  const handleSaveConsultationModal = (
    updatedCita: any,
    shouldFinish: boolean = false,
  ) => {
    const citaActualizada = {
      ...updatedCita,
      status: shouldFinish ? "finalizada" : "en-consulta",
    };

    if (onSaveConsultation) {
      onSaveConsultation(citaActualizada, shouldFinish);
    } else {
      onSaveAppointment(citaActualizada);
    }

    setIsConsultationModalOpen(false);
    setSelectedCitaForConsultation(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Citas Agendadas
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Gestión y control de todas las citas registradas en el sistema.
          </p>
        </div>
      </div>

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
            {sortCitasByHour(
              citasActivas.filter((c) => c.fecha === selectedDayDetail.dateStr),
            ).length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-slate-500 italic">
                  No hay citas registradas para este día.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortCitasByHour(
                  citasActivas.filter(
                    (c) => c.fecha === selectedDayDetail.dateStr,
                  ),
                ).map((cita, index) => (
                  <AppointmentCard
                    key={cita.id || index}
                    cita={cita}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteAppointment}
                    onStartConsultation={handleStartConsultation}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
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
                {citasDeHoy.map((cita, index) => (
                  <AppointmentCard
                    key={cita.id || index}
                    cita={cita}
                    onEdit={handleOpenEdit}
                    onDelete={onDeleteAppointment}
                    onStartConsultation={handleStartConsultation}
                  />
                ))}
              </div>
            ))}

          {activeTab === "semana" && (
            <WeekView
              weekDays={weekDays}
              citas={citasActivas}
              onSelectDay={(dateStr, title) =>
                setSelectedDayDetail({ dateStr, title })
              }
            />
          )}

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
              citas={citasActivas}
              onSelectDay={(dateStr, title) =>
                setSelectedDayDetail({ dateStr, title })
              }
            />
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <AppointmentForm
              initialData={editingAppointment}
              onSaveAppointment={handleSaveWrapper}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}

      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        cita={selectedCitaForConsultation}
        onSaveConsultation={handleSaveConsultationModal}
      />
    </div>
  );
};

export default Schedule;
