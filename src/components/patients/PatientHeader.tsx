import { Users, Plus } from "lucide-react";

interface PatientsHeaderProps {
  onNewRecord: () => void;
}

export const PatientHeader = ({ onNewRecord }: PatientsHeaderProps) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Users className="w-7 h-7 text-[#ece883]" />
          Gestión de Pacientes
        </h1>
        <p className="text-sm text-slate-400 max-w-xl">
          Busca, consulta y administra pacientes y propietarios de la clínica.
        </p>
      </div>
      <div className="relative z-10 flex justify-start sm:justify-end">
        <button
          onClick={onNewRecord}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ece883] text-slate-950 font-bold text-sm hover:bg-[#e4df68] transition-all shadow-md shadow-[#ece883]/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nuevo Registro
        </button>
      </div>
    </div>
  );
};
