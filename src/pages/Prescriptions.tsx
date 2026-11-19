import { useMemo, useState } from "react";
import { CheckCircle, FileText, Pill, Search, X } from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { DeletePrescriptionModal } from "../components/prescriptions/DeletePrescriptionModal";
import { PrescriptionCard } from "../components/prescriptions/PrescriptionCard";
import { PrescriptionDetailModal } from "../components/prescriptions/PrescriptionDetailModal";
import { printPrescription } from "../components/prescriptions/printPrescription";
import { getDoctorName } from "../constants/appConstants";
import { useAppointments } from "../hooks/useAppointments";
import { usePatients } from "../hooks/usePatients";
import { usePrescriptions } from "../hooks/usePrescriptions";
import type { Prescription } from "../types/prescription";

const Prescriptions = () => {
  const { prescriptions, getPrescription, deletePrescription } =
    usePrescriptions();
  const { patients, getPatient } = usePatients();
  const { getAppointment } = useAppointments();

  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const resolvePatientName = (prescription: Prescription): string =>
    getPatient(prescription.patientId)?.name ?? "Paciente no disponible";

  // Las recetas más recientes aparecen primero.
  const sortedPrescriptions = useMemo(
    () =>
      [...prescriptions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [prescriptions],
  );

  // Opciones del filtro: solo pacientes que tienen al menos una receta.
  const patientOptions = useMemo(() => {
    const nombres = new Map(
      patients.map((patient): [string, string] => [patient.id, patient.name]),
    );
    const opciones = new Map<string, string>();
    prescriptions.forEach((prescription) => {
      opciones.set(
        prescription.patientId,
        nombres.get(prescription.patientId) ?? "Paciente no disponible",
      );
    });
    return [...opciones.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [patients, prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedPrescriptions.filter((prescription) => {
      if (
        patientFilter !== "all" &&
        prescription.patientId !== patientFilter
      ) {
        return false;
      }
      if (!query) return true;

      const textoBusqueda = [
        getPatient(prescription.patientId)?.name ?? "",
        ...prescription.medications.map((medication) => medication.name),
      ]
        .join(" ")
        .toLowerCase();

      return textoBusqueda.includes(query);
    });
  }, [sortedPrescriptions, patientFilter, searchQuery, getPatient]);

  const detailPrescription = detailId ? getPrescription(detailId) : undefined;
  const deleteTarget = deleteId ? getPrescription(deleteId) : undefined;

  const resolveVeterinarian = (
    prescription: Prescription,
  ): string | undefined => {
    const doctorId = getAppointment(prescription.appointmentId)?.doctorId;
    return doctorId ? getDoctorName(doctorId) : undefined;
  };

  const handlePrint = (prescription: Prescription) => {
    printPrescription(
      prescription,
      resolvePatientName(prescription),
      resolveVeterinarian(prescription),
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    deletePrescription(deleteTarget.id);
    setDeleteId(null);
    if (detailId === deleteTarget.id) setDetailId(null);
    setFeedback("Receta eliminada correctamente.");
  };

  const hayFiltros =
    searchQuery.trim() !== "" || patientFilter !== "all";

  return (
    <PageShell>
      <PageBanner
        icon={Pill}
        title="Recetas"
        description="Recetas emitidas en las consultas"
        actions={
          <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300">
            {prescriptions.length}{" "}
            {prescriptions.length === 1 ? "receta" : "recetas"}
          </span>
        }
      />

      {feedback ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <span className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {feedback}
          </span>
          <button
            type="button"
            onClick={() => setFeedback("")}
            aria-label="Cerrar aviso"
            className="text-xs font-semibold opacity-70 transition-opacity hover:opacity-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por paciente o medicamento..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-[#ece883] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="min-w-[220px] flex-1 space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Paciente
            </span>
            <select
              value={patientFilter}
              onChange={(event) => setPatientFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-[#ece883] focus:outline-none transition-colors"
            >
              <option value="all">Todos los pacientes</option>
              {patientOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          {hayFiltros ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setPatientFilter("all");
              }}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {hayFiltros ? (
          <p className="text-xs text-slate-500">
            Mostrando {filteredPrescriptions.length} de {prescriptions.length}{" "}
            recetas.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ece883]">
            <FileText className="h-4 w-4" />
            Listado de recetas
          </h2>
          <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
            {filteredPrescriptions.length}{" "}
            {filteredPrescriptions.length === 1 ? "receta" : "recetas"}
          </span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 py-14 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 stroke-1 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              Aún no hay recetas registradas.
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              Las recetas emitidas al finalizar una consulta aparecerán aquí.
            </p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 py-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 stroke-1 text-slate-600" />
            <p className="text-sm text-slate-400">
              No hay recetas que coincidan con la búsqueda o el filtro.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                patientName={resolvePatientName(prescription)}
                onView={() => setDetailId(prescription.id)}
                onPrint={() => handlePrint(prescription)}
                onDelete={() => setDeleteId(prescription.id)}
              />
            ))}
          </div>
        )}
      </section>

      {detailPrescription ? (
        <PrescriptionDetailModal
          prescription={detailPrescription}
          patientName={resolvePatientName(detailPrescription)}
          veterinarian={resolveVeterinarian(detailPrescription)}
          onClose={() => setDetailId(null)}
          onPrint={() => {
            handlePrint(detailPrescription);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <DeletePrescriptionModal
          prescription={deleteTarget}
          patientName={resolvePatientName(deleteTarget)}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </PageShell>
  );
};

export default Prescriptions;
