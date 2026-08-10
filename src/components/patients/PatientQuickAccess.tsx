// src/components/patients/PatientQuickAccess.tsx
import { History, UserCheck } from "lucide-react";

interface PatientQuickAccessProps {
  onSelectShortcut: (patientName: string) => void;
  recentPatients?: string[]; // 👈 Lista de nombres o IDs de pacientes recientemente abiertos
}

export const PatientQuickAccess = ({
  onSelectShortcut,
  recentPatients = [],
}: PatientQuickAccessProps) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm h-full flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#ece883] mb-1 flex items-center gap-2">
            <History className="w-4 h-4" />
            Accesos Rápidos
          </h3>
          <p className="text-xs text-slate-400">
            Historial de fichas consultadas recientemente
          </p>
        </div>

        <div className="space-y-3 text-sm text-slate-300">
          <span className="text-xs font-semibold text-slate-400 block mb-1">
            🕒 Últimos abiertos
          </span>

          {recentPatients.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center space-y-1">
              <UserCheck className="w-5 h-5 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 italic">
                Aún no hay pacientes recientes. Las fichas que abras aparecerán
                aquí.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {recentPatients.map((name, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => onSelectShortcut(name)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 text-slate-300 hover:text-[#ece883] transition-colors cursor-pointer text-xs font-medium flex items-center justify-between group"
                  >
                    <span>• {name}</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-[#ece883] transition-colors">
                      Ver ficha
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-4 text-center">
        <span className="text-xs text-slate-500 italic">
          VetCare+ Acceso Directo
        </span>
      </div>
    </div>
  );
};

export default PatientQuickAccess;
