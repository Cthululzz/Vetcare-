import { Zap, Calendar, Stethoscope, Search } from "lucide-react";

interface QuickAccessBarProps {
  onNavigate: (path: string) => void;
}

export const QuickAccessBar = ({ onNavigate }: QuickAccessBarProps) => {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#ece883]" />
        Accesos Rápidos del Sistema
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agendar Cita */}
        <button
          onClick={() => onNavigate("/agenda/nuevo")}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-[#ece883]/50 rounded-2xl p-6 transition-all group flex items-center gap-5 text-left shadow-sm cursor-pointer"
        >
          <div className="pointer-events-none absolute w-[220px] h-[220px] bg-[#ece883]/10 blur-[70px] rounded-full -top-10 -right-10 group-hover:bg-[#ece883]/20 transition-all" />

          <div className="relative z-10 w-14 h-14 rounded-2xl bg-[#ece883]/10 border border-[#ece883]/20 flex items-center justify-center text-[#ece883] group-hover:scale-105 transition-transform shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-base font-semibold text-white group-hover:text-[#ece883] transition-colors">
              Agendar Cita
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Programar nuevo paciente en agenda
            </p>
          </div>
        </button>

        {/* Nueva Consulta */}
        <button
          onClick={() => onNavigate("/consulta/nueva")}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all group flex items-center gap-5 text-left shadow-sm cursor-pointer"
        >
          <div className="pointer-events-none absolute w-[220px] h-[220px] bg-emerald-500/10 blur-[70px] rounded-full -top-10 -right-10 group-hover:bg-emerald-500/20 transition-all" />

          <div className="relative z-10 w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Nueva Consulta
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Iniciar atención médica especializada
            </p>
          </div>
        </button>

        {/* Buscar Paciente */}
        <button
          onClick={() => onNavigate("/pacientes")}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all group flex items-center gap-5 text-left shadow-sm cursor-pointer"
        >
          <div className="pointer-events-none absolute w-[220px] h-[220px] bg-blue-500/10 blur-[70px] rounded-full -top-10 -right-10 group-hover:bg-blue-500/20 transition-all" />

          <div className="relative z-10 w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
            <Search className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
              Buscar Paciente
            </p>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Revisar historiales y fichas clínicas
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
