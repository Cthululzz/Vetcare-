import { useMemo } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Stethoscope,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ESTADOS_CITA,
  TIPOS_CITA,
  getEstadoCitaLabel,
  getTipoCitaLabel,
} from "../../constants/appConstants";
import type { EstadoCita } from "../../constants/appConstants";
import type { Appointment } from "../../types/appointment";
import { ReportKpiCard } from "./ReportKpiCard";
import { calcularPorcentaje } from "./reportUtils";

interface AppointmentsReportProps {
  /** Citas ya filtradas por sucursal y por rango de fechas. */
  appointments: Appointment[];
}

const ICONOS_ESTADO: Record<EstadoCita, LucideIcon> = {
  programada: CalendarClock,
  en_consulta: Stethoscope,
  finalizada: CheckCircle2,
  cancelada: XCircle,
};

/** Reporte de totales por estado y desglose por tipo de cita. */
export const AppointmentsReport = ({
  appointments,
}: AppointmentsReportProps) => {
  const estados = useMemo(() => {
    const conteo = ESTADOS_CITA.reduce(
      (acc, estado) => {
        acc[estado] = 0;
        return acc;
      },
      {} as Record<EstadoCita, number>,
    );

    for (const cita of appointments) {
      if (cita.status in conteo) conteo[cita.status] += 1;
    }

    return ESTADOS_CITA.map((estado) => ({
      estado,
      label: getEstadoCitaLabel(estado),
      total: conteo[estado],
      porcentaje: calcularPorcentaje(conteo[estado], appointments.length),
    }));
  }, [appointments]);

  const tipos = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const tipo of TIPOS_CITA) conteo.set(tipo.value, 0);
    for (const cita of appointments) {
      conteo.set(cita.tipo, (conteo.get(cita.tipo) ?? 0) + 1);
    }

    const conocidos = new Set<string>(TIPOS_CITA.map((tipo) => tipo.value));
    return [...conteo.entries()]
      .filter(([tipo, total]) => conocidos.has(tipo) || total > 0)
      .map(([tipo, total]) => ({
        tipo,
        label: getTipoCitaLabel(tipo),
        total,
        porcentaje: calcularPorcentaje(total, appointments.length),
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "es"));
  }, [appointments]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <CalendarCheck className="h-5 w-5 text-[#ece883]" />
            Citas por estado y tipo
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Distribución de las citas del rango seleccionado.
          </p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">
          {appointments.length}{" "}
          {appointments.length === 1 ? "cita" : "citas"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {estados.map(({ estado, label, total, porcentaje }) => (
          <ReportKpiCard
            key={estado}
            label={label}
            value={total}
            icon={ICONOS_ESTADO[estado]}
            hint={`${porcentaje}% del total`}
          />
        ))}
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#ece883]">
          Desglose por tipo
        </h3>
        {tipos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-10 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 stroke-1 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No hay citas para mostrar en el rango seleccionado.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ajusta las fechas o limpia los filtros para ver el desglose.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tipo de cita</th>
                  <th className="px-4 py-3 text-right font-semibold">Citas</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Participación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tipos.map(({ tipo, label, total, porcentaje }) => (
                  <tr key={tipo} className="text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-[#ece883]"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-400">
                          {porcentaje}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
