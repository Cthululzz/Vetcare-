import {
  Clock,
  User,
  Stethoscope,
  MapPin,
  Calendar,
  Play,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  getPetIcon,
  getAppointmentBadgeStyle,
  getAppointmentGlowConfig,
} from "../../utils/formatters";
import { formatDateLatam } from "../../utils/dateUtils";
import { can } from "../../utils/permissions";
import { usePatients } from "../../hooks/usePatients";
import type { Appointment } from "../../types/appointment";
import type { UserRole } from "../../constants/appConstants";
import {
  getDoctorName,
  getSucursalName,
  getTipoCitaLabel,
  getEstadoCitaLabel,
} from "../../constants/appConstants";

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails?: (appointment: Appointment) => void;
  onStartConsultation?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
  userRoles?: UserRole[];
}

export const AppointmentCard = ({
  appointment,
  onViewDetails,
  onStartConsultation,
  onEdit,
  onDelete,
  showDate = false,
  userRoles = ["VET"],
}: AppointmentCardProps) => {
  // Obtener datos completos del paciente y dueño usando los IDs
  const { getPatient, getOwner } = usePatients();
  const patient = getPatient(appointment.patientId);
  const owner = patient ? getOwner(patient.ownerId) : null;

  // Configs visuales (se aplican aunque no se encuentre el paciente)
  const glowConfig = getAppointmentGlowConfig(appointment.tipo);
  const badgeStyle = getAppointmentBadgeStyle(appointment.tipo);
  const status = appointment.status || "programada";

  const isVeterinarian = can.accessClinicalFlow(userRoles);

  // Resolver labels desde IDs
  const tipoLabel = getTipoCitaLabel(appointment.tipo);
  const statusLabel = getEstadoCitaLabel(status);
  const doctorName = getDoctorName(appointment.doctorId);
  const sucursalName = getSucursalName(appointment.sucursalId);

  const getStatusBadge = (currentStatus: string) => {
    switch (currentStatus) {
      case "en_consulta":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse";
      case "finalizada":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "cancelada":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  if (!patient || !owner) {
    return (
      <div className="relative rounded-2xl p-5 sm:p-6 bg-slate-900 border border-slate-800 min-h-[240px] flex items-center justify-center">
        <p className="text-slate-400 text-sm italic">
          Datos del paciente no disponibles.
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={() => onViewDetails?.(appointment)}
      className={`relative rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full bg-slate-900 border transition-all duration-300 hover:scale-[1.01] cursor-pointer overflow-hidden ${glowConfig.borderStyle}`}
      style={glowConfig.glowStyle}
    >
      <div className="relative z-10">
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badgeStyle}`}
            >
              {tipoLabel}
            </span>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusBadge(
                status,
              )}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-bold text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/40">
            <Clock className="w-4 h-4" />
            <span>{appointment.hora}</span>
          </div>
        </div>

        {/* Información del Paciente */}
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
            {getPetIcon(patient.species, patient.gender)}
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {patient.name}
          </h3>
        </div>

        <p className="text-sm text-slate-300 flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Propietario: <strong className="text-white">{owner.name}</strong>
          </span>
        </p>

        {/* Detalles Adicionales y Botón de Acción Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="space-y-1 text-xs sm:text-sm text-slate-400">
            <p className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Doctor: {doctorName}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">{sucursalName}</span>
            </p>
          </div>

          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isVeterinarian &&
              status !== "finalizada" &&
              status !== "cancelada" &&
              onStartConsultation && (
                <button
                  onClick={() => onStartConsultation(appointment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {status === "en_consulta"
                    ? "Continuar Consulta"
                    : "Iniciar Consulta"}
                </button>
              )}

            {status === "finalizada" && onViewDetails && (
              <button
                onClick={() => onViewDetails(appointment)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Ver Expediente
              </button>
            )}
          </div>
        </div>

        {/* Motivo de la Cita */}
        {appointment.motivo && (
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs sm:text-sm text-slate-300 mb-2">
            <p className="font-semibold text-slate-200 mb-0.5">Motivo:</p>
            <p className="line-clamp-2 text-slate-400">{appointment.motivo}</p>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Fecha y Botones de Editar / Eliminar */}
      <div
        className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {showDate && appointment.fecha ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-[#ece883]" />
              {formatDateLatam(appointment.fecha)}
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(appointment)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(appointment.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-400 text-xs sm:text-sm font-semibold transition-colors border border-red-900/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
