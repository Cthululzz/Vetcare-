// src/components/dashboard/NextPatientCard.tsx
import { Clock, FileText, Stethoscope } from "lucide-react";
import {
  getPetIcon,
  getCardGlowConfig,
  getBadgeStyle,
} from "../schedule/appointmentUtils";

interface Paciente {
  id: string;
  hora: string;
  paciente: string;
  propietario: string;
  motivo: string;
  tipo: string;
  tipoMascota?: string;
  genero?: "Macho" | "Hembra" | string;
}

interface NextPatientCardProps {
  paciente: Paciente;
  onNavigate: (path: string) => void;
  onStartConsultation?: (paciente: Paciente) => void;
}

export const NextPatientCard = ({
  paciente,
  onNavigate,
}: NextPatientCardProps) => {
  // Obtenemos la configuración de glow y estilo según el tipo de cita
  const glowConfig = getCardGlowConfig(paciente.tipo);
  const badgeStyle = getBadgeStyle(paciente.tipo);

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
            {paciente.hora}
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 my-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {paciente.paciente}
                </h4>

                {/* Ícono de mascota con su respectivo género */}
                {getPetIcon(
                  paciente.tipoMascota || paciente.tipo,
                  paciente.genero,
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Propietario:{" "}
                <span className="text-slate-300 font-medium">
                  {paciente.propietario}
                </span>
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-md border font-medium ${badgeStyle}`}
            >
              {paciente.tipo}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-4 pt-4 border-t border-slate-800/60 italic leading-relaxed">
            Motivo: "{paciente.motivo}"
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/pacientes/${paciente.id}/historial`);
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
            // Obligamos a redirigir a la vista de agenda con el parámetro para abrir el modal allá
            onNavigate(`/agenda?consultar=${paciente.id}`);
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
