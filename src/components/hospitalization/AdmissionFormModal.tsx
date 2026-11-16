import { useMemo, useState } from "react";
import {
  AlertCircle,
  BedDouble,
  CalendarClock,
  Search,
  X,
} from "lucide-react";
import type { Owner, Patient } from "../../types/patient";
import { SUCURSALES } from "../../constants/appConstants";
import {
  DEFAULT_MONITORING_FREQUENCY,
  FRECUENCIAS_MONITOREO,
} from "../../constants/hospitalization";
import { PetAvatar } from "../common/PetAvatar";

export interface AdmissionData {
  patientId: string;
  reason: string;
  diagnosis?: string;
  weight: number;
  bed: string;
  monitoringFrequency: number;
  initialTreatment?: string;
  sucursalId: string;
}

interface AdmissionFormModalProps {
  isOpen: boolean;
  patients: Patient[];
  getOwner: (ownerId: string) => Owner | undefined;
  availableBeds: string[];
  onAdmit: (data: AdmissionData) => string | null;
  onClose: () => void;
}

export const AdmissionFormModal = ({
  isOpen,
  patients,
  getOwner,
  availableBeds,
  onAdmit,
  onClose,
}: AdmissionFormModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [weight, setWeight] = useState("");
  const [bed, setBed] = useState("");
  const [monitoringFrequency, setMonitoringFrequency] = useState(
    DEFAULT_MONITORING_FREQUENCY,
  );
  const [initialTreatment, setInitialTreatment] = useState("");
  const [sucursalId, setSucursalId] = useState<string>(SUCURSALES[0].id);
  const [error, setError] = useState("");

  const filteredPatients = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return patients;

    return patients.filter((patient) => {
      const owner = getOwner(patient.ownerId);
      return (
        patient.name.toLowerCase().includes(query) ||
        owner?.name.toLowerCase().includes(query) ||
        owner?.phone.toLowerCase().includes(query)
      );
    });
  }, [patients, searchQuery, getOwner]);

  // Mantener una cama válida aunque cambie la disponibilidad entre aperturas.
  const selectedBed = availableBeds.includes(bed)
    ? bed
    : (availableBeds[0] ?? "");

  if (!isOpen) return null;

  const resetForm = () => {
    setSearchQuery("");
    setSelectedPatientId("");
    setReason("");
    setDiagnosis("");
    setWeight("");
    setBed("");
    setMonitoringFrequency(DEFAULT_MONITORING_FREQUENCY);
    setInitialTreatment("");
    setSucursalId(SUCURSALES[0].id);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedPatientId) {
      setError("Selecciona el paciente que ingresará a hospitalización.");
      return;
    }
    if (!reason.trim()) {
      setError("Indica el motivo de la internación.");
      return;
    }

    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError("Ingresa el peso del paciente en kg (mayor a cero).");
      return;
    }

    if (!selectedBed) {
      setError("No hay camas disponibles en este momento.");
      return;
    }

    const submitError = onAdmit({
      patientId: selectedPatientId,
      reason: reason.trim(),
      diagnosis: diagnosis.trim() || undefined,
      weight: parsedWeight,
      bed: selectedBed,
      monitoringFrequency,
      initialTreatment: initialTreatment.trim() || undefined,
      sucursalId,
    });

    if (submitError) {
      setError(submitError);
      return;
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Ingreso a Hospitalización
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Registra la admisión, cama y plan de monitoreo inicial.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="admission-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* Selección de paciente */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Paciente *
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar por paciente, dueño o teléfono..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div className="max-h-52 overflow-y-auto bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800/70">
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 px-4">
                  No hay pacientes disponibles para hospitalizar. Si el
                  paciente no existe, créalo primero desde Fichas y Contactos.
                </p>
              ) : (
                filteredPatients.map((patient) => {
                  const owner = getOwner(patient.ownerId);
                  const isSelected = selectedPatientId === patient.id;

                  return (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setError("");
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#ece883]/10"
                          : "hover:bg-slate-900/70"
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <PetAvatar
                          species={patient.species}
                          gender={patient.gender}
                          size="sm"
                          breed={patient.breed}
                          className={
                            isSelected
                              ? "rounded-2xl ring-2 ring-[#ece883]/50"
                              : ""
                          }
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white break-words">
                            {patient.name}
                          </span>
                          <span className="block text-xs text-slate-400 break-words">
                            {owner?.name || "Sin propietario"}
                            {owner?.phone ? ` • ${owner.phone}` : ""}
                          </span>
                        </span>
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ece883] shrink-0">
                          Seleccionado
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Datos clínicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Motivo de internación *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ej. Postoperatorio, deshidratación..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Diagnóstico presuntivo
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                placeholder="Ej. Gastroenteritis aguda"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Peso al ingreso (kg) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={weight}
                onChange={(event) => {
                  setWeight(event.target.value);
                  setError("");
                }}
                placeholder="Ej. 12.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Cama asignada *
              </label>
              <select
                value={selectedBed}
                onChange={(event) => setBed(event.target.value)}
                disabled={availableBeds.length === 0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors disabled:text-slate-500"
              >
                {availableBeds.length === 0 ? (
                  <option value="">Sin camas disponibles</option>
                ) : (
                  availableBeds.map((availableBed) => (
                    <option key={availableBed} value={availableBed}>
                      {availableBed}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Frecuencia de monitoreo *
              </label>
              <select
                value={monitoringFrequency}
                onChange={(event) =>
                  setMonitoringFrequency(Number(event.target.value))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {FRECUENCIAS_MONITOREO.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Sucursal *
              </label>
              <select
                value={sucursalId}
                onChange={(event) => setSucursalId(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {SUCURSALES.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#ece883] shrink-0" />
                Primera revisión en {monitoringFrequency} horas
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Tratamiento inicial
            </label>
            <textarea
              value={initialTreatment}
              onChange={(event) => setInitialTreatment(event.target.value)}
              rows={3}
              placeholder="Fluidoterapia, medicamentos, cuidados iniciales..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="admission-form"
            disabled={availableBeds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            <BedDouble className="w-4 h-4" />
            Registrar Ingreso
          </button>
        </div>
      </div>
    </div>
  );
};
