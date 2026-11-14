import {
  Activity,
  BedDouble,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Pencil,
  Pill,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import type { Owner, Patient } from "../../types/patient";
import type {
  Hospitalization,
  MedicationAdministration,
} from "../../types/hospitalization";
import { getSucursalName } from "../../constants/appConstants";

interface HospitalizationDetailModalProps {
  isOpen: boolean;
  patient: Patient | null;
  owner?: Owner;
  hospitalization: Hospitalization | null;
  onClose: () => void;
  onEditMedication?: (medication: MedicationAdministration) => void;
  onDeleteMedication?: (medication: MedicationAdministration) => void;
}

const formatDateTime = (value?: string): string => {
  if (!value) return "No registrado";
  return new Date(value).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateValue = (value?: string): string => {
  if (!value) return "No programado";
  if (value.length === 10) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return new Date(value).toLocaleDateString("es-CL");
};

const DataField = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
      {label}
    </p>
    <p className="text-sm text-slate-200 whitespace-pre-wrap">
      {value || "No registrado"}
    </p>
  </div>
);

const formatDose = (medication: MedicationAdministration): string => {
  const dose = medication.dose ?? medication.quantity;
  const unit = medication.doseUnit ?? medication.unit ?? "";
  return `${dose} ${unit}`.trim();
};

export const HospitalizationDetailModal = ({
  isOpen,
  patient,
  owner,
  hospitalization,
  onClose,
  onEditMedication,
  onDeleteMedication,
}: HospitalizationDetailModalProps) => {
  if (!isOpen || !patient || !hospitalization) return null;

  const evolutions = [...(hospitalization.evolutions ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const medications = [...(hospitalization.medications ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const summary = hospitalization.dischargeSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Ficha de Hospitalización
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {patient.name}
                {owner ? ` • ${owner.name}` : ""}
                {hospitalization.bed ? ` • ${hospitalization.bed}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resumen del ingreso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DataField
              label="Estado"
              value={
                hospitalization.status === "activa"
                  ? "Hospitalización activa"
                  : "Alta médica"
              }
            />
            <DataField
              label="Cama"
              value={hospitalization.bed || "Sin cama asignada"}
            />
            <DataField
              label="Peso al ingreso"
              value={
                hospitalization.weightAtAdmission != null
                  ? `${hospitalization.weightAtAdmission} kg`
                  : undefined
              }
            />
            <DataField
              label="Ingreso"
              value={formatDateTime(hospitalization.admittedAt)}
            />
            <DataField
              label={
                hospitalization.status === "activa"
                  ? "Próxima revisión"
                  : "Fecha de alta"
              }
              value={
                hospitalization.status === "activa"
                  ? formatDateTime(hospitalization.nextReviewAt)
                  : formatDateTime(hospitalization.dischargedAt)
              }
            />
            <DataField label="Motivo" value={hospitalization.reason} />
            <DataField label="Diagnóstico" value={hospitalization.diagnosis} />
            <DataField
              label="Frecuencia de monitoreo"
              value={
                hospitalization.monitoringFrequency
                  ? `Cada ${hospitalization.monitoringFrequency} horas`
                  : undefined
              }
            />
            <DataField
              label="Sucursal"
              value={
                hospitalization.sucursalId
                  ? getSucursalName(hospitalization.sucursalId)
                  : undefined
              }
            />
            <DataField label="Ingresado por" value={hospitalization.createdBy} />
          </div>

          {hospitalization.notes && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tratamiento inicial
              </p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {hospitalization.notes}
              </p>
            </div>
          )}

          {/* Resumen de alta */}
          {summary && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Resumen de Alta
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DataField
                  label="Diagnóstico de alta"
                  value={summary.diagnosis}
                />
                <DataField
                  label="Próximo control"
                  value={formatDateValue(summary.nextControlAt)}
                />
                <DataField
                  label="Tratamiento realizado"
                  value={summary.treatment}
                />
                <DataField
                  label="Indicaciones"
                  value={summary.indications}
                />
              </div>
            </div>
          )}

          {/* Evoluciones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Evoluciones ({evolutions.length})
            </h3>

            {evolutions.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                Aún no se han registrado evoluciones para esta internación.
              </p>
            ) : (
              <div className="space-y-3">
                {evolutions.map((evolution) => {
                  const hasVitals =
                    evolution.temperature ||
                    evolution.heartRate ||
                    evolution.respiratoryRate;

                  return (
                    <div
                      key={evolution.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5 text-[#ece883]" />
                          {formatDateTime(evolution.date)}
                        </span>
                        {evolution.createdBy && (
                          <span className="text-[10px] text-slate-500">
                            por {evolution.createdBy}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 whitespace-pre-wrap">
                        {evolution.notes}
                      </p>

                      {hasVitals && (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {evolution.temperature && (
                            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                              🌡️ {evolution.temperature}°C
                            </span>
                          )}
                          {evolution.heartRate && (
                            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1">
                              <HeartPulse className="w-3 h-3 text-red-400" />
                              {evolution.heartRate} lpm
                            </span>
                          )}
                          {evolution.respiratoryRate && (
                            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                              🫁 {evolution.respiratoryRate} rpm
                            </span>
                          )}
                        </div>
                      )}

                      {evolution.treatmentChanges && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Cambios en tratamiento
                          </p>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap">
                            {evolution.treatmentChanges}
                          </p>
                        </div>
                      )}

                      {evolution.nursingObservations && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Observaciones de enfermería
                          </p>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap">
                            {evolution.nursingObservations}
                          </p>
                        </div>
                      )}

                      {evolution.nextReviewAt && (
                        <p className="text-[11px] text-slate-500">
                          Próxima revisión programada:{" "}
                          <span className="text-slate-300">
                            {formatDateTime(evolution.nextReviewAt)}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Medicación administrada */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medicación administrada ({medications.length})
            </h3>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                No se ha registrado medicación desde inventario.
              </p>
            ) : (
              <div className="space-y-2">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {medication.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(medication.date)}
                        {medication.createdBy
                          ? ` • por ${medication.createdBy}`
                          : ""}
                      </p>
                      {medication.notes && (
                        <p className="text-xs text-slate-400 mt-1">
                          {medication.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#ece883] shrink-0">
                      {formatDose(medication)}
                    </span>
                    {hospitalization.status === "activa" &&
                      (onEditMedication || onDeleteMedication) && (
                        <div className="flex items-center gap-1 shrink-0">
                          {onEditMedication && (
                            <button
                              type="button"
                              onClick={() => onEditMedication(medication)}
                              title="Editar dosis"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#ece883] hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteMedication && (
                            <button
                              type="button"
                              onClick={() => onDeleteMedication(medication)}
                              title="Eliminar registro"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5" />
            {hospitalization.status === "activa"
              ? "Internación activa"
              : "Internación finalizada"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar ficha
          </button>
        </div>
      </div>
    </div>
  );
};
