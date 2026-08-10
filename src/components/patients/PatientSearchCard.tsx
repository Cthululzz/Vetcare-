import { Search } from "lucide-react";

interface PatientSearchCardProps {
  activeTab: "patients" | "owners";
  onChangeTab: (tab: "patients" | "owners") => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
}

export const PatientSearchCard = ({
  activeTab,
  onChangeTab,
  searchQuery,
  onChangeSearch,
}: PatientSearchCardProps) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => onChangeTab("patients")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "patients"
              ? "bg-[#ece883] text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          🐾 Pacientes
        </button>
        <button
          onClick={() => onChangeTab("owners")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "owners"
              ? "bg-[#ece883] text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          👤 Propietarios
        </button>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onChangeSearch(e.target.value)}
          placeholder={
            activeTab === "patients"
              ? "Buscar por nombre, microchip o propietario..."
              : "Buscar por nombre, correo o teléfono..."
          }
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 transition-colors"
        />
      </div>
    </div>
  );
};
