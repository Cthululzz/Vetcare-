import { CalendarDays, RotateCcw } from "lucide-react";

interface ReportsDateFilterProps {
  desde: string;
  hasta: string;
  onDesdeChange: (value: string) => void;
  onHastaChange: (value: string) => void;
  onClear: () => void;
  /** Indica si hay algún filtro activo para habilitar el botón de limpieza. */
  active: boolean;
}

const inputClassName =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#ece883] [color-scheme:dark]";

/** Barra superior de filtros por rango de fechas de los reportes. */
export const ReportsDateFilter = ({
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onClear,
  active,
}: ReportsDateFilterProps) => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <CalendarDays className="h-4 w-4 text-[#ece883]" />
            Rango de fechas
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Aplica a citas y pacientes. El stock crítico no depende de este
            rango.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!active}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Desde
          </span>
          <input
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(event) => onDesdeChange(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hasta
          </span>
          <input
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(event) => onHastaChange(event.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
    </section>
  );
};
