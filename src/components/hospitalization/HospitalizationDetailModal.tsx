import {
  Activity,
  BedDouble,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Mail,
  Phone,
  Pill,
  X,
} from "lucide-react";
import type { Owner, Patient } from "../../types/patient";
import type { Hospitalization } from "../../types/hospitalization";
import { getSucursalName } from "../../constants/appConstants";
import { formatFractionWithUnit } from "../../utils/inventoryUnits";
import { formatDateShort, formatDateTimeShort } from "../../utils/dateUtils";
import { isMedicationPlanOverdue } from "../../utils/hospitalizationTasks";
import { formatWeightWithUnit } from "../../utils/weight";
import { PetAvatar } from "../common/PetAvatar";

interface HospitalizationDetailModalProps {
  isOpen: boolean;
  patient: Patient | null;
  owner?: Owner;
  hospitalization: Hospitalization | null;
  onClose: () => void;
}

const formatDateTime = (value?: string): string => {
  if (!value) return "No registrado";
  return formatDateTimeShort(value) || "No registrado";
};

const formatDateValue = (value?: string): string => {
  if (!value) return "No programado";
  if (value.length === 10) return formatDateShort(value);
  const formatted = formatDateTimeShort(value);
  return formatted ? formatted.slice(0, 10) : "No programado";
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

export const HospitalizationDetailModal = ({
  isOpen,
  patient,
  owner,
  hospitalization,
  onClose,
}: HospitalizationDetailModalProps) => {
  if (!isOpen || !patient || !hospitalization) return null;

  const evolutions = [...(hospitalization.evolutions ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const summary = hospitalization.dischargeSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="flex items-start gap-4 min-w-0">
            <PetAvatar
              species={patient.species}
              gender={patient.gender}
              size="md"
              breed={patient.breed}
            />
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-xl font-bold text-white">
                Ficha de Hospitalización
              </h2>
              <p className="text-sm text-slate-300 break-words">
                <span className="font-semibold text-white">{patient.name}</span>
                {hospitalization.bed ? ` • ${hospitalization.bed}` : ""}
              </p>
              <div className="text-xs text-slate-400 space-y-0.5">
                <p className="break-words">
                  Propietario:{" "}
                  <span className="text-slate-200">
                    {owner?.name || "Sin propietario"}
                  </span>
                </p>
                {(owner?.phone || owner?.email) && (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {owner?.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {owner.phone}
                      </span>
                    )}
                    {owner?.email && (
                      <span className="inline-flex items-center gap-1 break-all">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {owner.email}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
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
                  ? formatWeightWithUnit(
                      hospitalization.weightAtAdmission,
                      hospitalization.weightAtAdmissionUnit,
                    )
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

          {/* Plan de remedios */}
          {hospitalization.status === "activa" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Plan de remedios ({(hospitalization.medicationPlans ?? []).filter((plan) => plan.isActive).length} activos)
              </h3>

              {(hospitalization.medicationPlans ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                  Este paciente aún no tiene un plan de remedios programado.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...(hospitalization.medicationPlans ?? [])]
                    .sort((a, b) => {
                      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                      return a.nextDoseAt.localeCompare(b.nextDoseAt);
                    })
                    .map((plan) => {
                      const overdue = isMedicationPlanOverdue(plan);

                      return (
                        <div
                          key={plan.id}
                          className={`rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
                            plan.isActive
                              ? overdue
                                ? "bg-red-500/5 border-red-500/20"
                                : "bg-slate-950/60 border-slate-800"
                              : "bg-slate-950/30 border-slate-800/60 opacity-70"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {plan.productName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatFractionWithUnit(
                                plan.dose,
                                plan.unit ?? "",
                              )}{" "}
                              cada {plan.frequencyHours} h
                              {plan.durationDays
                                ? ` · ${plan.durationDays} días`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              !plan.isActive
                                ? "text-slate-500"
                                : overdue
                                  ? "text-red-400"
                                  : "text-emerald-300"
                            }`}
                          >
                            {plan.isActive
                              ? `${overdue ? "Dosis atrasada: " : "Próxima dosis: "}${formatDateTime(plan.nextDoseAt)}`
                              : "Plan detenido"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

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
