// src/components/schedule/MonthCalendarView.tsx
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

interface MonthCalendarViewProps {
  currentCalendarDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  citas: any[];
  onSelectDay: (dateStr: string, title: string) => void;
}

export const MonthCalendarView = ({
  currentCalendarDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  citas,
  onSelectDay,
}: MonthCalendarViewProps) => {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const monthNameFormatted = currentCalendarDate.toLocaleString("es-ES", {
    month: "long",
  });
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Cabecera del Calendario */}
      <div className="grid grid-cols-3 items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex justify-start">
          <button
            onClick={onPrevMonth}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Mes anterior
          </button>
        </div>

        <div className="text-center justify-self-center">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {year}
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest text-[#ece883] block mt-0.5 capitalize">
            {monthNameFormatted}
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onNextMonth}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            Próximo mes <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grilla del Calendario */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <span key={d} className="font-bold text-slate-500 py-1">
            {d}
          </span>
        ))}

        {Array.from({ length: firstDayIndex }, (_, i) => (
          <div key={`empty-${i}`} className="h-16" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
          const formattedMonth =
            month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
          const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

          const dateObj = new Date(year, month, dayNum);
          const fullTitle = dateObj.toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          const capitalizedTitle =
            fullTitle.charAt(0).toUpperCase() + fullTitle.slice(1);

          const citasDelDia = citas.filter((c) => c.fecha === targetDateStr);
          const hasCita = citasDelDia.length > 0;

          return (
            <div
              key={i}
              onClick={() => onSelectDay(targetDateStr, capitalizedTitle)}
              className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 transition-all cursor-pointer hover:scale-105 ${
                hasCita
                  ? "bg-[#ece883] text-slate-950 font-black border-[#ece883] shadow-md shadow-[#ece883]/10"
                  : "bg-slate-950/40 text-slate-400 border-slate-800/60 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span className="text-xs">{dayNum}</span>
              {hasCita && (
                <span className="text-[9px] bg-slate-950/20 px-1.5 py-0.5 rounded mt-1 font-bold">
                  {citasDelDia.length}{" "}
                  {citasDelDia.length === 1 ? "cita" : "citas"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pie del Calendario */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-center">
        <button
          onClick={onGoToToday}
          className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer shadow-sm border border-slate-700/60 flex items-center gap-2"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#ece883]" />
          Ir a día actual
        </button>
      </div>
    </div>
  );
};
