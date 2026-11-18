import { BedDouble, CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { EspecieMascota, Genero } from "../../constants/appConstants";
import type { HospitalBed } from "../../types/hospitalization";
import { PetAvatar } from "../common/PetAvatar";

export interface BedMapItem {
  /** Nombre visible de la cama. Puede repetirse entre sucursales. */
  bed: string;
  /** Clave única con organización + sucursal + nombre. */
  bedKey: string;
  /** Entidad persistida, necesaria para quitar solo esta cama. */
  entity: HospitalBed;
  sucursalLabel?: string;
  patientName?: string;
  species?: EspecieMascota | string;
  gender?: Genero | string;
  hospitalizationId?: string;
}

interface BedMapProps {
  beds: BedMapItem[];
  onOpenHospitalization?: (hospitalizationId: string) => void;
  onAddBed?: () => void;
  onRemoveBed?: (bed: BedMapItem) => void;
  canRemoveBeds?: boolean;
}

export const BedMap = ({
  beds,
  onOpenHospitalization,
  onAddBed,
  onRemoveBed,
  canRemoveBeds = false,
}: BedMapProps) => {
  const occupiedCount = beds.filter((bed) => bed.patientName).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
          <BedDouble className="w-4 h-4" />
          Mapa de Camas
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            {occupiedCount} ocupadas • {beds.length - occupiedCount} disponibles
          </span>
          {onAddBed && (
            <button
              type="button"
              onClick={onAddBed}
              title="Agregar una cama al área de hospitalización"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar cama
            </button>
          )}
        </div>
      </div>

      {beds.length === 0 ? (
        <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
          No hay camas configuradas. Agrega una para poder hospitalizar
          pacientes.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {beds.map((item) => {
            const isOccupied = Boolean(item.patientName);

            return (
              <div key={item.bedKey} className="relative">
                <button
                  type="button"
                  disabled={!isOccupied || !item.hospitalizationId}
                  onClick={() => {
                    if (item.hospitalizationId && onOpenHospitalization) {
                      onOpenHospitalization(item.hospitalizationId);
                    }
                  }}
                  className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                    isOccupied
                      ? "bg-amber-500/5 border-amber-500/25 hover:border-amber-500/50 cursor-pointer"
                      : "bg-slate-950/40 border-slate-800 cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pr-5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isOccupied ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {item.bed}
                      {item.sucursalLabel && (
                        <span className="ml-1 font-medium text-slate-500">
                          · {item.sucursalLabel}
                        </span>
                      )}
                    </span>
                    {isOccupied && item.species ? (
                      <PetAvatar
                        species={item.species}
                        gender={item.gender}
                        size="xs"
                      />
                    ) : isOccupied ? (
                      <BedDouble className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <p
                    className={`mt-1.5 text-xs font-semibold leading-snug break-words ${
                      isOccupied ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {item.patientName || "Disponible"}
                  </p>
                </button>

                {!isOccupied && onRemoveBed && canRemoveBeds && (
                  <button
                    type="button"
                    onClick={() => onRemoveBed(item)}
                    title={`Quitar ${item.bed}${item.sucursalLabel ? ` (${item.sucursalLabel})` : ""}`}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
