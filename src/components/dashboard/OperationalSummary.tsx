import { Calendar, CheckSquare, AlertTriangle, ArrowRight } from "lucide-react";
import { useAppointments } from "../../hooks/useAppointments";

interface OperationalSummaryProps {
  tareas: number;
  alertas: number;
  /** Hay una tarea cuya hora ya llegó o un recordatorio por enviar. */
  tareasParaAhora: boolean;
  onNavigate: (path: string) => void;
}

export const OperationalSummary = ({
  tareas,
  alertas,
  tareasParaAhora,
  onNavigate,
}: OperationalSummaryProps) => {
  // Consumir citas directamente del hook (no más props drilling)
  const { totalCitasHoy } = useAppointments();

  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Resumen Operativo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Citas (Azul) */}
        <div
          onClick={() => onNavigate("/agenda")}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5.5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="pointer-events-none absolute w-[260px] h-[260px] bg-blue-500/10 blur-[90px] rounded-full -top-14 -right-14 group-hover:bg-blue-500/20 transition-all" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                Citas Hoy
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">
              {totalCitasHoy}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Pacientes agendados para la jornada actual.
            </p>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-blue-400 group-hover:underline">
            <span>Abrir módulo de Agenda</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Tareas (Verde) */}
        <div
          onClick={() => onNavigate("/tareas")}
          className={`relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5.5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between ${
            tareasParaAhora ? "vetcare-dashboard-task-urgent" : ""
          }`}
        >
          <div className="pointer-events-none absolute w-[260px] h-[260px] bg-emerald-500/10 blur-[90px] rounded-full -top-14 -right-14 group-hover:bg-emerald-500/20 transition-all" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                Próximas tareas
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">
              {tareas}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Dosis, revisiones y recordatorios de las próximas 24 horas.
            </p>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-emerald-400 group-hover:underline">
            <span>Ver listado de tareas</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Alertas (Amarillo / #ece883) */}
        <div
          onClick={() => onNavigate("/tareas?tab=alertas")}
          className={`relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5.5 transition-all cursor-pointer group shadow-sm flex flex-col justify-between ${
            alertas > 0 ? "vetcare-dashboard-alert-urgent" : ""
          }`}
        >
          <div className="pointer-events-none absolute w-[260px] h-[260px] bg-[#ece883]/10 blur-[90px] rounded-full -top-14 -right-14 group-hover:bg-[#ece883]/20 transition-all" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">
                Alertas Activas
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#ece883] group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight mb-1">
              {alertas}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Dosis y revisiones que ya pasaron su horario.
            </p>
          </div>
          <div className="relative z-10 mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-[#ece883] group-hover:underline">
            <span>Revisar alertas activas</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
