import { Clock, FileText, Stethoscope } from "lucide-react";
import {
  getPetIcon,
  getAppointmentGlowConfig,
  getAppointmentBadgeStyle,
} from "../../utils/formatters";
import { usePatients } from "../../hooks/usePatients";
import { formatTime } from "../../utils/dateUtils";
import { formatAppointmentTypeLabel } from "../../utils/formatters";
import type { Appointment } from "../../types/appointment";

interface NextPatientCardProps {
  appointment: Appointment;
  onNavigate: (path: string) => void;
  onStartConsultation?: (appointment: Appointment) => void;
}

export const NextPatientCard = ({
  appointment,
  onNavigate,
}: NextPatientCardProps) => {
  // Obtener datos completos del paciente y dueño usando los IDs
  const { getPatient, getOwner } = usePatients();
  const patient = getPatient(appointment.patientId);
  const owner = patient ? getOwner(patient.ownerId) : null;

  // Manejo de caso donde no se encuentran los datos
  if (!patient || !owner) {
    return (
      <div className="relative rounded-2xl p-7 bg-slate-900 border border-slate-800 min-h-[240px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">
          Datos del paciente no disponibles.
        </p>
      </div>
    );
  }

  // Obtenemos la configuración de glow y estilo según el tipo de cita
  const glowConfig = getAppointmentGlowConfig(appointment.tipo);
  const badgeStyle = getAppointmentBadgeStyle(appointment.tipo);

  // Formatear hora para mostrar
  const horaFormateada = formatTime(appointment.hora);

  // Formatear tipo de cita para mostrar
  const tipoFormateado = formatAppointmentTypeLabel(appointment.tipo);

  return (
    <div
      className={`relative rounded-2xl p-7 flex flex-col justify-between bg-slate-900 border transition-all duration-300 overflow-hidden min-h-[240px] ${glowConfig.borderStyle}`}
      style={glowConfig.glowStyle}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Próximo Paciente
            </h3>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-lg font-medium">
            {horaFormateada}
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 my-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {patient.name}
                </h4>

                {/* Ícono de mascota con su respectivo género */}
                {getPetIcon(patient.species, patient.gender)}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Propietario:{" "}
                <span className="text-slate-300 font-medium">{owner.name}</span>
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-md border font-medium ${badgeStyle}`}
            >
              {tipoFormateado}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-4 pt-4 border-t border-slate-800/60 italic leading-relaxed">
            Motivo: "{appointment.motivo}"
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/pacientes/${patient.id}/historial`);
          }}
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Historial Clínico</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // Redirigir a la vista de agenda con el parámetro para abrir el modal allá
            onNavigate(`/agenda?consultar=${appointment.id}`);
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Iniciar Consulta</span>
        </button>
      </div>
    </div>
  );
};
