// src/components/schedule/WeekView.tsx
import {
  sortCitasByHour,
  getPetIcon,
  getCardGlowConfig,
} from "./appointmentUtils";

interface WeekViewProps {
  weekDays: { name: string; dateStr: string }[];
  citas: any[];
  onSelectDay: (dateStr: string, title: string) => void;
}

export const WeekView = ({ weekDays, citas, onSelectDay }: WeekViewProps) => {
  return (
    <div className="space-y-4">
      {weekDays.map((dia, idx) => {
        const citasDelDia = sortCitasByHour(
          citas.filter((c) => c.fecha === dia.dateStr),
        );
        const primerasCitas = citasDelDia.slice(0, 3);
        const citasRestantes = citasDelDia.length - 3;

        const dateObj = new Date(dia.dateStr + "T00:00:00");
        const fullTitle = dateObj.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const capitalizedTitle =
          fullTitle.charAt(0).toUpperCase() + fullTitle.slice(1);

        return (
          <div
            key={idx}
            onClick={() => onSelectDay(dia.dateStr, capitalizedTitle)}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-6 cursor-pointer group shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-0 -mr-0 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#ece883]">
                {capitalizedTitle}
              </h3>
              <span className="text-xs text-slate-400 group-hover:text-white transition-colors">
                {citasDelDia.length} citas registradas (Ver detalle) &rarr;
              </span>
            </div>

            {citasDelDia.length === 0 ? (
              <p className="text-sm text-slate-500 italic relative z-10">
                No hay citas registradas
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
                {primerasCitas.map((cita, cIdx) => {
                  const glowConfig = getCardGlowConfig(cita.tipo);

                  return (
                    <div
                      key={cIdx}
                      className={`bg-slate-950/80 border p-4 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group/card ${glowConfig.borderStyle}`}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-60 group-hover/card:opacity-100"
                        style={glowConfig.glowStyle}
                      />

                      {/* Arriba: Tipo de cita */}
                      <div className="flex items-center justify-between mb-2.5 relative z-10">
                        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md font-medium tracking-wide">
                          {cita.tipo || "General"}
                        </span>
                        <span className="text-xs text-blue-400 font-semibold">
                          {cita.hora}
                        </span>
                      </div>

                      {/* Abajo: Ícono directamente junto al nombre del paciente */}
                      <div className="flex items-center gap-2.5 mb-1 relative z-10">
                        <div className="shrink-0 flex items-center justify-center">
                          {getPetIcon(cita.tipoMascota, cita.genero)}
                        </div>
                        <span className="font-bold text-white text-base truncate">
                          {cita.paciente}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 truncate relative z-10 pl-7">
                        Prop: {cita.propietario}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {citasRestantes > 0 && (
              <p className="text-xs text-[#ece883] font-semibold mt-3 text-right relative z-10">
                Hay {citasRestantes} citas más...
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
