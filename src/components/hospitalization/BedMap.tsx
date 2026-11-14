import { BedDouble, CheckCircle2 } from "lucide-react";

export interface BedMapItem {
  bed: string;
  patientName?: string;
  hospitalizationId?: string;
}

interface BedMapProps {
  beds: BedMapItem[];
  onOpenHospitalization?: (hospitalizationId: string) => void;
}

export const BedMap = ({ beds, onOpenHospitalization }: BedMapProps) => {
  const occupiedCount = beds.filter((bed) => bed.patientName).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
          <BedDouble className="w-4 h-4" />
          Mapa de Camas
        </h2>
        <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {occupiedCount} ocupadas • {beds.length - occupiedCount} disponibles
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {beds.map((item) => {
          const isOccupied = Boolean(item.patientName);

          return (
            <button
              key={item.bed}
              type="button"
              disabled={!isOccupied || !item.hospitalizationId}
              onClick={() => {
                if (item.hospitalizationId && onOpenHospitalization) {
                  onOpenHospitalization(item.hospitalizationId);
                }
              }}
              className={`text-left rounded-xl border px-3.5 py-3 transition-colors ${
                isOccupied
                  ? "bg-amber-500/5 border-amber-500/25 hover:border-amber-500/50 cursor-pointer"
                  : "bg-slate-950/40 border-slate-800 cursor-default"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isOccupied ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {item.bed}
                </span>
                {isOccupied ? (
                  <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <p
                className={`text-xs font-semibold mt-1.5 truncate ${
                  isOccupied ? "text-white" : "text-slate-500"
                }`}
              >
                {item.patientName || "Disponible"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
