import { useMemo } from "react";
import { PawPrint, Users } from "lucide-react";
import { getEspecieLabel } from "../../constants/appConstants";
import type { Patient } from "../../types/patient";
import { ReportKpiCard } from "./ReportKpiCard";
import { calcularPorcentaje } from "./reportUtils";

interface PatientsBySpeciesReportProps {
  /** Pacientes ya filtrados por sucursal y por rango de fechas. */
  patients: Patient[];
}

/** Reporte de pacientes agrupados por especie, con porcentaje del total. */
export const PatientsBySpeciesReport = ({
  patients,
}: PatientsBySpeciesReportProps) => {
  const especies = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const paciente of patients) {
      conteo.set(
        paciente.species,
        (conteo.get(paciente.species) ?? 0) + 1,
      );
    }

    return [...conteo.entries()]
      .map(([especie, total]) => ({
        especie,
        label: getEspecieLabel(especie),
        total,
        porcentaje: calcularPorcentaje(total, patients.length),
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "es"));
  }, [patients]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <PawPrint className="h-5 w-5 text-[#ece883]" />
            Pacientes por especie
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Se considera la última actividad clínica de cada ficha o su fecha de
            creación.
          </p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">
          {patients.length} {patients.length === 1 ? "paciente" : "pacientes"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReportKpiCard
          label="Total de pacientes"
          value={patients.length}
          icon={Users}
          hint="Fichas consideradas en el rango"
        />
        <ReportKpiCard
          label="Especies registradas"
          value={especies.length}
          icon={PawPrint}
          hint="Categorías con al menos una ficha"
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#ece883]">
          Distribución
        </h3>
        {especies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-10 text-center">
            <PawPrint className="mx-auto h-10 w-10 stroke-1 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No hay pacientes para mostrar en el rango seleccionado.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ajusta las fechas o limpia los filtros para ver la distribución.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Especie</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Pacientes
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    % del total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {especies.map(({ especie, label, total, porcentaje }) => (
                  <tr key={especie} className="text-slate-300">
                    <td className="px-4 py-3 font-medium text-white">{label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{total}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-[#ece883]">
                      {porcentaje}%
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
