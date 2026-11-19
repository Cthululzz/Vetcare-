import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { AppointmentsReport } from "../components/reports/AppointmentsReport";
import { LowStockReport } from "../components/reports/LowStockReport";
import { PatientsBySpeciesReport } from "../components/reports/PatientsBySpeciesReport";
import { ReportsDateFilter } from "../components/reports/ReportsDateFilter";
import {
  estaEnRangoFechas,
  getFechaReferenciaPaciente,
} from "../components/reports/reportUtils";
import { useAppointments } from "../hooks/useAppointments";
import { useInventory } from "../hooks/useInventory";
import { usePatients } from "../hooks/usePatients";

/** Página de reportes: todo se calcula en memoria desde los hooks existentes. */
const Reports = () => {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Los hooks ya entregan los datos limitados a la sucursal vigente.
  const { appointments } = useAppointments();
  const { patients } = usePatients();
  const { getLowStockProducts } = useInventory();

  // El stock no depende del rango de fechas.
  const lowStockItems = getLowStockProducts();

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((cita) =>
        estaEnRangoFechas(cita.fecha, desde, hasta),
      ),
    [appointments, desde, hasta],
  );

  const filteredPatients = useMemo(
    () =>
      patients.filter((paciente) =>
        estaEnRangoFechas(
          getFechaReferenciaPaciente(paciente),
          desde,
          hasta,
        ),
      ),
    [patients, desde, hasta],
  );

  const hayFiltros = Boolean(desde || hasta);

  const limpiarFiltros = () => {
    setDesde("");
    setHasta("");
  };

  return (
    <PageShell>
      <PageBanner
        icon={BarChart3}
        title="Reportes"
        description="Indicadores de citas, pacientes y stock crítico de la sucursal activa."
      />

      <ReportsDateFilter
        desde={desde}
        hasta={hasta}
        onDesdeChange={setDesde}
        onHastaChange={setHasta}
        onClear={limpiarFiltros}
        active={hayFiltros}
      />

      <AppointmentsReport appointments={filteredAppointments} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <PatientsBySpeciesReport patients={filteredPatients} />
        <LowStockReport items={lowStockItems} />
      </div>
    </PageShell>
  );
};

export default Reports;
