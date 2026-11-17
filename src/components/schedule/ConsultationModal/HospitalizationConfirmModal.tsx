import { useState } from "react";
import { BedDouble, Clock, Pill, Plus, Trash2, X } from "lucide-react";
import {
  DEFAULT_MONITORING_FREQUENCY,
  FRECUENCIAS_MONITOREO,
} from "../../../constants/hospitalization";
import { useInventory } from "../../../hooks/useInventory";
import type { MedicationPlanInput } from "../../../hooks/useHospitalizations";
import type { HospitalizationFormData } from "../../../types/consultation";
import { formatQuantityDisplay } from "../../../utils/inventoryUnits";

// ============================================
// AYUDAS DE FECHA (input datetime-local)
// ============================================

const pad2 = (value: number): string => String(value).padStart(2, "0");

const toLocalInputValue = (iso?: string): string => {
  const date = iso ? new Date(iso) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${safe.getFullYear()}-${pad2(safe.getMonth() + 1)}-${pad2(
    safe.getDate(),
  )}T${pad2(safe.getHours())}:${pad2(safe.getMinutes())}`;
};

const fromLocalInputValue = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

// ============================================
// TIPOS Y COMPONENTE
// ============================================

interface PlanDraft {
  productId: string;
  dose: string;
  frequencyHours: string;
  startedAt: string;
  durationDays: string;
  notes: string;
}

const createEmptyPlanDraft = (): PlanDraft => ({
  productId: "",
  dose: "",
  frequencyHours: "8",
  startedAt: toLocalInputValue(),
  durationDays: "",
  notes: "",
});

interface HospitalizationConfirmModalProps {
  patientName: string;
  onConfirm: (data: HospitalizationFormData) => void;
  onCancel: () => void;
}

/**
 * Confirmación de hospitalización desde la consulta.
 * Pide el motivo (obligatorio), la frecuencia de monitoreo y el plan de
 * medicamentos, que se crea junto con el ingreso.
 */
export const HospitalizationConfirmModal = ({
  patientName,
  onConfirm,
  onCancel,
}: HospitalizationConfirmModalProps) => {
  const { getProducts } = useInventory();
  const products = getProducts();

  const [reason, setReason] = useState("");
  const [monitoringFrequency, setMonitoringFrequency] = useState(
    DEFAULT_MONITORING_FREQUENCY,
  );
  const [plans, setPlans] = useState<MedicationPlanInput[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(createEmptyPlanDraft);
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");

  const inputClass =
    "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors";
  const selectedProduct = products.find(
    (product) => product.id === planDraft.productId,
  );

  const handleAddPlan = () => {
    const product = products.find(
      (item) => item.id === planDraft.productId,
    );
    if (!product) {
      setPlanError("Selecciona un remedio del inventario.");
      return;
    }

    const dose = Number(planDraft.dose);
    if (!Number.isFinite(dose) || dose <= 0) {
      setPlanError("Ingresa una dosis mayor a cero.");
      return;
    }

    const frequencyHours = Number(planDraft.frequencyHours);
    if (!Number.isFinite(frequencyHours) || frequencyHours <= 0) {
      setPlanError("Selecciona la frecuencia entre dosis.");
      return;
    }

    const startedAt = fromLocalInputValue(planDraft.startedAt);
    if (!startedAt) {
      setPlanError("Indica la fecha y hora de la primera dosis.");
      return;
    }

    const durationDays = Number(planDraft.durationDays);

    setPlans((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        dose,
        unit: product.unit,
        frequencyHours,
        startedAt,
        durationDays:
          planDraft.durationDays.trim() !== "" &&
          Number.isFinite(durationDays)
            ? durationDays
            : undefined,
        notes: planDraft.notes.trim() || undefined,
      },
    ]);
    setPlanDraft(createEmptyPlanDraft());
    setShowPlanForm(false);
    setPlanError("");
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Indica el motivo de la hospitalización.");
      return;
    }

    onConfirm({
      reason: reason.trim(),
      monitoringFrequency,
      medicationPlans: plans,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border flex items-center justify-center bg-amber-500/20 border-amber-500/40 text-amber-400">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Confirmar hospitalización
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {patientName} será enviado al área de internación y monitoreo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Motivo de la hospitalización *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError("");
              }}
              placeholder="Ej. Postoperatorio, deshidratación, observación..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Frecuencia de monitoreo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Frecuencia de monitoreo *
              </label>
              <select
                value={monitoringFrequency}
                onChange={(event) =>
                  setMonitoringFrequency(Number(event.target.value))
                }
                className={`${inputClass} cursor-pointer`}
              >
                {FRECUENCIAS_MONITOREO.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#ece883] shrink-0" />
                Primera revisión en {monitoringFrequency} horas
              </div>
            </div>
          </div>

          {/* Plan de medicamentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#ece883]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Plan de medicamentos
                </h4>
              </div>
              {!showPlanForm && (
                <button
                  type="button"
                  onClick={() => {
                    setPlanDraft(createEmptyPlanDraft());
                    setPlanError("");
                    setShowPlanForm(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ece883]/10 hover:bg-[#ece883]/20 text-[#ece883] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar remedio
                </button>
              )}
            </div>

            {plans.length === 0 && !showPlanForm && (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                No se agregaron medicamentos. Puedes dejar el plan vacío y
                registrarlo después desde la ficha de hospitalización.
              </p>
            )}

            {plans.length > 0 && (
              <div className="space-y-2">
                {plans.map((plan, index) => (
                  <div
                    key={`${plan.productId}-${plan.startedAt}-${index}`}
                    className="flex items-start justify-between gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5"
                  >
                    <div className="min-w-0 text-xs">
                      <p className="font-semibold text-white break-words">
                        {plan.productName}
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        {plan.dose} {plan.unit || ""} · cada {plan.frequencyHours}{" "}
                        {plan.frequencyHours === 1 ? "hora" : "horas"}
                        {plan.durationDays
                          ? ` · ${plan.durationDays} días`
                          : ""}
                      </p>
                      {plan.notes && (
                        <p className="text-slate-500 mt-0.5 italic">
                          {plan.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPlans((prev) =>
                          prev.filter((_, planIndex) => planIndex !== index),
                        )
                      }
                      aria-label="Quitar remedio"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Editor de plan */}
            {showPlanForm && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="sm:col-span-2 block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Remedio del inventario
                    </span>
                    <select
                      value={planDraft.productId}
                      onChange={(event) => {
                        setPlanDraft((prev) => ({
                          ...prev,
                          productId: event.target.value,
                        }));
                        setPlanError("");
                      }}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Selecciona un remedio...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (stock:{" "}
                          {formatQuantityDisplay(
                            product.currentStock,
                            product,
                          )}
                          )
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Dosis por administración
                      {selectedProduct ? ` (${selectedProduct.unit})` : ""}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={planDraft.dose}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({
                          ...prev,
                          dose: event.target.value,
                        }))
                      }
                      placeholder="Ej. 1.5"
                      className={inputClass}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Frecuencia
                    </span>
                    <select
                      value={planDraft.frequencyHours}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({
                          ...prev,
                          frequencyHours: event.target.value,
                        }))
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
                        <option key={hours} value={hours}>
                          Cada {hours} {hours === 1 ? "hora" : "horas"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Primera dosis
                    </span>
                    <input
                      type="datetime-local"
                      value={planDraft.startedAt}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({
                          ...prev,
                          startedAt: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Duración en días (opcional)
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={planDraft.durationDays}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({
                          ...prev,
                          durationDays: event.target.value,
                        }))
                      }
                      placeholder="Ej. 5"
                      className={inputClass}
                    />
                  </label>

                  <label className="sm:col-span-2 block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Indicaciones (opcional)
                    </span>
                    <input
                      type="text"
                      value={planDraft.notes}
                      onChange={(event) =>
                        setPlanDraft((prev) => ({
                          ...prev,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Ej. administrar con alimento"
                      className={inputClass}
                    />
                  </label>
                </div>

                {planError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {planError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setPlanError("");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPlan}
                    className="px-3 py-1.5 rounded-lg bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Agregar al plan
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs">
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            Confirmar hospitalización
          </button>
        </div>
      </div>
    </div>
  );
};
