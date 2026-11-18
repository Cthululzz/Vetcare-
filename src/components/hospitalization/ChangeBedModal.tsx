import { useState } from "react";
import { ArrowRightLeft, BedDouble, CheckCircle2, X } from "lucide-react";
import type { Patient } from "../../types/patient";
import type {
  HospitalBed,
  Hospitalization,
} from "../../types/hospitalization";
import { bedKey } from "../../utils/bedScope";

interface ChangeBedModalProps {
  isOpen: boolean;
  patient: Patient | null;
  hospitalization: Hospitalization | null;
  /** Camas libres en este momento. */
  availableBeds: HospitalBed[];
  onConfirm: (bed: string) => void;
  onCancel: () => void;
}

/**
 * Permite mover a un paciente hospitalizado a otra cama disponible.
 * La cama actual queda ocupada por la misma internación, por eso no
 * aparece en el listado de camas libres.
 */
export const ChangeBedModal = ({
  isOpen,
  patient,
  hospitalization,
  availableBeds,
  onConfirm,
  onCancel,
}: ChangeBedModalProps) => {
  const [selectedBedKey, setSelectedBedKey] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !patient || !hospitalization) return null;

  const bedsForHospitalization = availableBeds.filter(
    (bed) =>
      bed.organizationId === hospitalization.organizationId &&
      bed.sucursalId === hospitalization.sucursalId,
  );
  const selectedBedEntity =
    bedsForHospitalization.find(
      (bed) => bedKey(bed, bed.name) === selectedBedKey,
    ) ?? bedsForHospitalization[0];
  const selectedBed = selectedBedEntity?.name ?? "";
  const currentBed = hospitalization.bed || "Sin cama";

  const handleCancel = () => {
    setSelectedBedKey("");
    setError("");
    onCancel();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedBed) {
      setError("Selecciona la cama de destino.");
      return;
    }

    onConfirm(selectedBed);
    setSelectedBedKey("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-xl bg-[#ece883]/10 border border-[#ece883]/20 shrink-0">
              <ArrowRightLeft className="w-6 h-6 text-[#ece883]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-white">Cambiar cama</h3>
              <p className="text-sm text-slate-400 mt-1">
                Paciente:{" "}
                <span className="text-white font-medium">{patient.name}</span>
                {" • "}
                <span className="text-slate-300">Cama actual: {currentBed}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="change-bed-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            Elige una cama libre. El cambio se aplica de inmediato y no afecta
            la evolución, la medicación ni los horarios de revisión del
            paciente.
          </p>

          {bedsForHospitalization.length === 0 ? (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              No hay camas disponibles en la sucursal de esta internación.
              Libera una cama o agrega una nueva desde el mapa de camas.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Cama de destino *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bedsForHospitalization.map((bed) => {
                  const key = bedKey(bed, bed.name);
                  const isSelected =
                    selectedBedEntity !== undefined &&
                    bedKey(selectedBedEntity, selectedBedEntity.name) === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedBedKey(key);
                        setError("");
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#ece883]/15 border-[#ece883]/50 text-[#ece883]"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <BedDouble className="w-4 h-4 shrink-0" />
                      {bed.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </form>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="change-bed-form"
            disabled={!selectedBed}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar cambio
          </button>
        </div>
      </div>
    </div>
  );
};
