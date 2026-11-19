import type { LucideIcon } from "lucide-react";

interface ReportKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Texto secundario opcional bajo el valor principal. */
  hint?: string;
}

/** Tarjeta de indicador reutilizable, con el acento amarillo de la app. */
export const ReportKpiCard = ({
  label,
  value,
  icon: Icon,
  hint,
}: ReportKpiCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-[#ece883]/5 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {value}
          </p>
          {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 text-[#ece883]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
