// src/components/schedule/AppointmentCard.tsx
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
  getBadgeStyle,
  getCardGlowConfig,
  formatDateLatam,
} from "./appointmentUtils";

interface AppointmentCardProps {
  cita: any;
  onViewDetails?: (cita: any) => void;
  onStartConsultation?: (cita: any) => void;
  onEdit?: (cita: any) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
  userRole?: "veterinario" | "recepcionista" | "admin";
}

export const AppointmentCard = ({
  cita,
  onViewDetails,
  onStartConsultation,
  onEdit,
  onDelete,
  showDate = false,
  userRole = "veterinario",
}: AppointmentCardProps) => {
  const glowConfig = getCardGlowConfig(cita.tipo);
  const badgeStyle = getBadgeStyle(cita.tipo);

  const status = cita.status || "programada";

  const isVeterinarian = userRole === "veterinario" || userRole === "admin";

  const getStatusBadge = (currentStatus: string) => {
    switch (currentStatus) {
      case "en-consulta":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse";
      case "finalizada":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div
      onClick={() => onViewDetails?.(cita)}
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
              {cita.tipo}
            </span>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-md border uppercase tracking-wider ${getStatusBadge(
                status,
              )}`}
            >
              {status === "en-consulta"
                ? "En Consulta"
                : status === "finalizada"
                  ? "Finalizada"
                  : "Programada"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm font-bold text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/40">
            <Clock className="w-4 h-4" />
            <span>{cita.hora}</span>
          </div>
        </div>

        {/* Información del Paciente */}
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
            {getPetIcon(cita.tipoMascota, cita.genero)}
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            {cita.paciente}
          </h3>
        </div>

        <p className="text-sm text-slate-300 flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Propietario:{" "}
            <strong className="text-white">{cita.propietario}</strong>
          </span>
        </p>

        {/* Detalles Adicionales y Botón de Acción Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl">
          <div className="space-y-1 text-xs sm:text-sm text-slate-400">
            <p className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Doctor: {cita.doctor}</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="truncate">{cita.sucursal}</span>
            </p>
          </div>

          {/* Botón de Flujo Clínico (Siempre Azul si no está finalizada) */}
          <div
            className="flex items-center gap-2 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {isVeterinarian &&
              status !== "finalizada" &&
              onStartConsultation && (
                <button
                  onClick={() => onStartConsultation(cita)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {status === "en-consulta"
                    ? "Continuar Consulta"
                    : "Iniciar Consulta"}
                </button>
              )}

            {status === "finalizada" && onViewDetails && (
              <button
                onClick={() => onViewDetails(cita)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                Ver Expediente
              </button>
            )}
          </div>
        </div>

        {/* Motivo de la Cita */}
        {cita.motivo && (
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-xs sm:text-sm text-slate-300 mb-2">
            <p className="font-semibold text-slate-200 mb-0.5">Motivo:</p>
            <p className="line-clamp-2 text-slate-400">{cita.motivo}</p>
          </div>
        )}
      </div>

      {/* Pie de Tarjeta: Fecha y Botones de Editar / Eliminar */}
      <div
        className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {showDate && cita.fecha ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-[#ece883]" />
              {formatDateLatam(cita.fecha)}
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(cita)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(cita.id)}
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
