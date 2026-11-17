import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateShort } from "../../utils/dateUtils";

interface MiniDatePickerProps {
  /** Fecha en formato ISO "aaaa-mm-dd" (o "" si no hay fecha). */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

const pad2 = (value: number): string => String(value).padStart(2, "0");

const toIsoDate = (year: number, month: number, day: number): string =>
  `${year}-${pad2(month + 1)}-${pad2(day)}`;

const todayIsoDate = (): string => {
  const today = new Date();
  return toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
};

/**
 * Calendario mensual compacto para elegir una fecha desde el formulario.
 * Es la versión reducida del calendario mensual de la agenda.
 */
export const MiniDatePicker = ({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  icon,
  className = "",
  disabled = false,
}: MiniDatePickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = viewDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const today = todayIsoDate();

  const selectDate = (isoDate: string) => {
    onChange(isoDate);
    setOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`relative w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-left text-sm focus:outline-none focus:border-[#ece883] transition-colors disabled:opacity-50 cursor-pointer ${className}`}
      >
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            {icon}
          </span>
        )}
        <span className={value ? "text-white" : "text-slate-500"}>
          {value ? formatDateShort(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 left-0 w-[252px] bg-slate-950 border border-slate-700 rounded-xl p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-1 mb-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label="Mes anterior"
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white capitalize">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label="Mes siguiente"
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["L", "M", "X", "J", "V", "S", "D"].map((dayLabel) => (
              <span
                key={dayLabel}
                className="text-[10px] font-bold text-slate-500 py-1"
              >
                {dayLabel}
              </span>
            ))}

            {Array.from({ length: firstDayIndex }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isoDate = toIsoDate(year, month, day);
              const isSelected = isoDate === value;
              const isToday = isoDate === today;

              return (
                <button
                  type="button"
                  key={isoDate}
                  onClick={() => selectDate(isoDate)}
                  className={`h-7 w-7 text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-[#ece883] text-slate-950 font-bold"
                      : isToday
                        ? "text-[#ece883] ring-1 ring-[#ece883]/50 hover:bg-slate-800"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => selectDate("")}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
