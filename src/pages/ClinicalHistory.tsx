import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle,
  ClipboardPlus,
  FileText,
  Filter,
  History,
  Search,
  Weight,
} from "lucide-react";
import { Footer } from "../components/common/Footer";
import { ClinicalRecordCard } from "../components/patients/history/ClinicalRecordCard";
import { ClinicalRecordFormModal } from "../components/patients/history/ClinicalRecordFormModal";
import { RECORD_TYPE_META } from "../components/patients/history/recordTypeMeta";
import { useAuth } from "../hooks/useAuth";
import { usePatients } from "../hooks/usePatients";
import { usePermissions } from "../hooks/usePermissions";
import type { MedicalRecord, MedicalRecordType } from "../types/patient";
import {
  buildClinicalHistorySummary,
  countRecordsByType,
  getRecordDateOnly,
  getRecordType,
  MEDICAL_RECORD_TYPE_LABELS,
  MEDICAL_RECORD_TYPES,
  sortMedicalRecords,
} from "../utils/clinicalHistory";
import {
  formatDateShort,
  getPatientDisplayAge,
} from "../utils/dateUtils";
import { formatSpeciesLabel } from "../utils/formatters";
import { formatWeightWithUnit } from "../utils/weight";

type TypeFilter = MedicalRecordType | "all";

const ClinicalHistory = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patients, getOwner, deleteMedicalRecord } = usePatients();
  const { canAccessClinicalFlow } = usePermissions();
  const { user } = useAuth();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [feedback, setFeedback] = useState("");

  const patient = useMemo(
    () => patients.find((item) => item.id === patientId),
    [patients, patientId],
  );

  const history = useMemo(() => patient?.history ?? [], [patient]);

  const summary = useMemo(
    () => buildClinicalHistorySummary(history),
    [history],
  );
  const counts = useMemo(() => countRecordsByType(history), [history]);
  const sortedRecords = useMemo(
    () => sortMedicalRecords(history),
    [history],
  );

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedRecords.filter((record) => {
      const typeMatch =
        typeFilter === "all" || getRecordType(record) === typeFilter;
      if (!typeMatch) return false;
      if (!query) return true;

      return [
        record.notes,
        record.diagnosis,
        record.recommendations,
        record.veterinarian,
        MEDICAL_RECORD_TYPE_LABELS[getRecordType(record)],
        formatDateShort(getRecordDateOnly(record.date)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [sortedRecords, typeFilter, searchQuery]);

  if (!patient) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <FileText className="w-14 h-14 text-slate-600 mb-4 stroke-1" />
          <h1 className="text-2xl font-black text-white mb-2">
            Ficha no encontrada
          </h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            El paciente que buscas no existe o fue eliminado. Vuelve al
            directorio de fichas para seleccionar otro paciente.
          </p>
          <Link
            to="/pacientes/fichas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a las fichas
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const owner = getOwner(patient.ownerId);
  const hasFilters = typeFilter !== "all" || searchQuery.trim() !== "";

  const handleDelete = (recordId: string) => {
    const confirmed = window.confirm(
      "¿Eliminar este registro del historial clínico? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    deleteMedicalRecord(patient.id, recordId);
    setFeedback("Registro eliminado del historial clínico.");
  };

  const handleOpenNewRecord = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const summaryCards = [
    {
      label: "Registros totales",
      value: String(summary.total),
      detail: `${summary.consultations} consultas`,
      icon: FileText,
      iconClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    {
      label: "Última atención",
      value: summary.lastRecord
        ? formatDateShort(getRecordDateOnly(summary.lastRecord.date))
        : "Sin registros",
      detail: summary.lastRecord
        ? MEDICAL_RECORD_TYPE_LABELS[getRecordType(summary.lastRecord)]
        : "Agrega el primer registro",
      icon: CalendarDays,
      iconClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
    {
      label: "Último peso",
      value: summary.lastWeight
        ? formatWeightWithUnit(
            summary.lastWeight.value,
            summary.lastWeight.unit,
          )
        : "S/C",
      detail: summary.lastWeight
        ? `Registrado el ${formatDateShort(getRecordDateOnly(summary.lastWeight.date))}`
        : "Sin peso registrado",
      icon: Weight,
      iconClass: "bg-[#ece883]/10 text-[#ece883] border-[#ece883]/20",
    },
    {
      label: "Próximo control",
      value: summary.nextVisit
        ? formatDateShort(summary.nextVisit.date)
        : "Sin programar",
      detail: summary.nextVisit
        ? "Control indicado en el historial"
        : "Agrega una fecha al registrar",
      icon: CalendarClock,
      iconClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        {/* Encabezado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <button
              type="button"
              onClick={() => navigate("/pacientes/fichas")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#ece883] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a las fichas de pacientes
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  <History className="w-8 h-8 text-[#ece883]" />
                  Historial clínico
                </h1>
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">{patient.name}</span>
                  {" · "}
                  {formatSpeciesLabel(patient.species)}
                  {patient.breed ? ` · ${patient.breed}` : ""}
                  {" · "}
                  {getPatientDisplayAge(patient)}
                </p>
                <p className="text-xs text-slate-400">
                  Propietario:{" "}
                  <span className="text-slate-200">
                    {owner?.name || "Sin propietario"}
                  </span>
                  {owner?.phone ? ` · ${owner.phone}` : ""}
                  {patient.microchip ? ` · Microchip ${patient.microchip}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {canAccessClinicalFlow && (
                  <button
                    type="button"
                    onClick={handleOpenNewRecord}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-md shadow-[#ece883]/10 cursor-pointer"
                  >
                    <ClipboardPlus className="w-4 h-4" />
                    Nuevo registro
                  </button>
                )}
              </div>
            </div>

            {patient.conditions && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <span className="font-bold uppercase tracking-wider">
                    Antecedentes:{" "}
                  </span>
                  {patient.conditions}
                </span>
              </div>
            )}

            {!patient.isActive && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-600/40 bg-slate-800/40 px-4 py-2.5 text-xs text-slate-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Esta ficha está marcada como inactiva. El historial se conserva
                solo para consulta.
              </div>
            )}
          </div>
        </div>

        {/* Retroalimentación */}
        {feedback && (
          <div className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
            <span className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {feedback}
            </span>
            <button
              type="button"
              onClick={() => setFeedback("")}
              className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4"
              >
                <div
                  className={`p-3 rounded-xl border ${card.iconClass} shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium">
                    {card.label}
                  </p>
                  <p className="text-lg font-bold text-white truncate">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {card.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por diagnóstico, notas, profesional o fecha..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Filtrar por tipo
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-[#ece883] text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Todos ({summary.total})
              </button>

              {MEDICAL_RECORD_TYPES.filter((type) => counts[type] > 0).map(
                (type) => {
                  const meta = RECORD_TYPE_META[type];
                  const Icon = meta.icon;
                  const selected = typeFilter === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        selected
                          ? meta.badgeClass
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {meta.label} ({counts[type]})
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-slate-500">
                Mostrando {filteredRecords.length} de {summary.total} registros.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Línea de tiempo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <History className="w-4 h-4" />
              Línea de tiempo clínica
            </h2>
            <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              {filteredRecords.length}{" "}
              {filteredRecords.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {summary.total === 0 ? (
            <div className="text-center py-14">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
              <p className="text-sm font-medium text-slate-300">
                Este paciente aún no tiene registros clínicos.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Las consultas finalizadas se agregan automáticamente. También
                puedes registrar vacunas, desparasitaciones, exámenes y notas
                con el botón “Nuevo registro”.
              </p>
              {canAccessClinicalFlow && (
                <button
                  type="button"
                  onClick={handleOpenNewRecord}
                  className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors cursor-pointer"
                >
                  <ClipboardPlus className="w-4 h-4" />
                  Agregar primer registro
                </button>
              )}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3 stroke-1" />
              <p className="text-sm text-slate-400">
                No hay registros que coincidan con la búsqueda o el filtro.
              </p>
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-4 sm:left-6 top-3 bottom-3 w-px bg-slate-800" />
              <div className="space-y-5">
                {filteredRecords.map((record) => (
                  <ClinicalRecordCard
                    key={record.id}
                    record={record}
                    onEdit={
                      canAccessClinicalFlow &&
                      getRecordType(record) !== "hospitalizacion"
                        ? () => handleEditRecord(record)
                        : undefined
                    }
                    onDelete={
                      canAccessClinicalFlow
                        ? () => handleDelete(record.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {showForm && (
        <ClinicalRecordFormModal
          isOpen
          patientId={patient.id}
          patientName={patient.name}
          record={editingRecord}
          defaultVeterinarian={user?.name}
          onClose={handleCloseForm}
          onSaved={() =>
            setFeedback(
              editingRecord
                ? "Registro actualizado en el historial clínico."
                : "Registro agregado al historial clínico.",
            )
          }
        />
      )}
    </div>
  );
};

export default ClinicalHistory;
