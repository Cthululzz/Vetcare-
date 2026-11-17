import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Pause,
  Pencil,
  Pill,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import type {
  Hospitalization,
  MedicationPlan,
} from "../../types/hospitalization";
import type { Patient } from "../../types/patient";
import type { MedicationPlanInput } from "../../hooks/useHospitalizations";
import { formatDateTimeShort } from "../../utils/dateUtils";
import {
  formatFractionWithUnit,
  formatQuantityDisplay,
  getStockDisplay,
} from "../../utils/inventoryUnits";
import { isMedicationPlanOverdue } from "../../utils/hospitalizationTasks";
import { ActionConfirmModal } from "../schedule/ConsultationModal/ConsultationModals";

// ============================================
// UTILIDADES DE FECHA
// ============================================

const pad2 = (value: number): string => String(value).padStart(2, "0");

/** Convierte un ISO a valor de <input type="datetime-local"> en hora local. */
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

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24];

// ============================================
// FORMULARIO
// ============================================

interface MedicationPlanFormProps {
  products: InventoryItem[];
  initialPlan?: MedicationPlan | null;
  onSubmit: (data: MedicationPlanInput) => string | null;
  onCancel: () => void;
}

const MedicationPlanForm = ({
  products,
  initialPlan,
  onSubmit,
  onCancel,
}: MedicationPlanFormProps) => {
  const [productId, setProductId] = useState(initialPlan?.productId ?? "");
  const [dose, setDose] = useState(
    initialPlan ? String(initialPlan.dose) : "",
  );
  const [frequencyHours, setFrequencyHours] = useState(
    String(initialPlan?.frequencyHours ?? 8),
  );
  const [startedAt, setStartedAt] = useState(
    toLocalInputValue(initialPlan?.startedAt),
  );
  const [durationDays, setDurationDays] = useState(
    initialPlan?.durationDays != null ? String(initialPlan.durationDays) : "",
  );
  const [notes, setNotes] = useState(initialPlan?.notes ?? "");
  const [error, setError] = useState("");

  const selectableProducts = products.filter(
    (product) =>
      product.isActive ||
      product.id === initialPlan?.productId,
  );
  const selectedProduct = selectableProducts.find(
    (product) => product.id === productId,
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const product = selectableProducts.find((item) => item.id === productId);
    if (!product) {
      setError("Selecciona un remedio del inventario.");
      return;
    }

    const parsedDose = Number(dose);
    if (!Number.isFinite(parsedDose) || parsedDose <= 0) {
      setError("Ingresa una dosis mayor a cero.");
      return;
    }

    const parsedFrequency = Number(frequencyHours);
    if (!Number.isFinite(parsedFrequency) || parsedFrequency <= 0) {
      setError("Selecciona la frecuencia entre dosis.");
      return;
    }

    const startedAtIso = fromLocalInputValue(startedAt);
    if (!startedAtIso) {
      setError("Indica la fecha y hora de inicio del tratamiento.");
      return;
    }

    const parsedDuration = Number(durationDays);
    const result = onSubmit({
      productId: product.id,
      productName: product.name,
      dose: parsedDose,
      unit: product.unit,
      frequencyHours: parsedFrequency,
      startedAt: startedAtIso,
      durationDays:
        durationDays.trim() !== "" && Number.isFinite(parsedDuration)
          ? parsedDuration
          : undefined,
      notes: notes.trim() || undefined,
    });

    if (result) {
      setError(result);
      return;
    }

    setError("");
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Remedio del inventario
          </span>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883]/60"
          >
            <option value="">Selecciona un remedio...</option>
            {selectableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.currentStock > 0
                  ? ` (stock: ${formatQuantityDisplay(
                      product.currentStock,
                      product,
                    )})`
                  : " (sin stock)"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Dosis por administración
            {selectedProduct ? ` (${selectedProduct.unit})` : ""}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={dose}
            onChange={(event) => setDose(event.target.value)}
            placeholder="Ej: 1.5"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Frecuencia
          </span>
          <select
            value={frequencyHours}
            onChange={(event) => setFrequencyHours(event.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883]/60"
          >
            {FREQUENCY_OPTIONS.map((hours) => (
              <option key={hours} value={hours}>
                Cada {hours} {hours === 1 ? "hora" : "horas"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Primera dosis
          </span>
          <input
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883]/60"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Duración en días (opcional)
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={durationDays}
            onChange={(event) => setDurationDays(event.target.value)}
            placeholder="Ej: 5"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60"
          />
        </label>

        <label className="sm:col-span-2 space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">
            Indicaciones (opcional)
          </span>
          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej: administrar con alimento"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60"
          />
        </label>
      </div>

      {selectedProduct && (
        <p className="text-[11px] text-slate-500">
          Stock actual:{" "}
          <span className="text-slate-300">
            {getStockDisplay(selectedProduct).primary}
          </span>
          {selectedProduct.expirationDate
            ? ` · vence ${formatDateTimeShort(
                `${selectedProduct.expirationDate}T12:00:00`,
              ).slice(0, 10)}`
            : ""}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {initialPlan ? "Guardar cambios" : "Crear plan"}
        </button>
      </div>
    </form>
  );
};

// ============================================
// MODAL
// ============================================

interface MedicationPlanModalProps {
  isOpen: boolean;
  patient: Patient | null;
  hospitalization: Hospitalization | null;
  products: InventoryItem[];
  onCreate: (data: MedicationPlanInput) => string | null;
  onUpdate: (planId: string, data: MedicationPlanInput) => string | null;
  onToggleActive: (planId: string, isActive: boolean) => void;
  onDelete: (planId: string) => void;
  onAdminister: (plan: MedicationPlan) => string | null;
  onClose: () => void;
}

export const MedicationPlanModal = ({
  isOpen,
  patient,
  hospitalization,
  products,
  onCreate,
  onUpdate,
  onToggleActive,
  onDelete,
  onAdminister,
  onClose,
}: MedicationPlanModalProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MedicationPlan | null>(null);
  const [actionError, setActionError] = useState("");
  const [pendingAdminPlan, setPendingAdminPlan] = useState<MedicationPlan | null>(
    null,
  );
  const [pendingDeletePlanId, setPendingDeletePlanId] = useState<string | null>(
    null,
  );

  if (!isOpen || !patient || !hospitalization) return null;

  const plans = [...(hospitalization.medicationPlans ?? [])].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.nextDoseAt.localeCompare(b.nextDoseAt);
  });
  const activeCount = plans.filter((plan) => plan.isActive).length;
  const medications = [...(hospitalization.medications ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  // Las alergias de la consulta se guardan en patient.conditions; van en el
  // plan de remedios para no administrar un fármaco al que el paciente es alérgico.
  const allergies = patient.conditions?.trim() ?? "";

  const closeForm = () => {
    setShowForm(false);
    setEditingPlan(null);
  };

  const handleAdminister = (plan: MedicationPlan) => {
    setActionError("");
    setPendingAdminPlan(plan);
  };

  const confirmAdminister = () => {
    if (!pendingAdminPlan) return;
    const message = onAdminister(pendingAdminPlan);
    setActionError(message ?? "");
    setPendingAdminPlan(null);
  };

  const pendingDeletePlan = plans.find((p) => p.id === pendingDeletePlanId);

  const confirmDelete = () => {
    if (!pendingDeletePlanId) return;
    onDelete(pendingDeletePlanId);
    setPendingDeletePlanId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Plan de remedios
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {patient.name}
                {hospitalization.bed ? ` • ${hospitalization.bed}` : ""} •{" "}
                {activeCount}{" "}
                {activeCount === 1 ? "remedio activo" : "remedios activos"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {allergies && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
              <div>
                <p className="text-sm font-bold text-amber-200">
                  Alergias / condiciones críticas
                </p>
                <p className="text-sm text-amber-100 mt-1 whitespace-pre-wrap break-words">
                  {allergies}
                </p>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              type="button"
              onClick={() => {
                setEditingPlan(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agregar remedio al plan
            </button>
          )}

          {showForm && (
            <MedicationPlanForm
              key={editingPlan?.id ?? "nuevo"}
              products={products}
              initialPlan={editingPlan}
              onSubmit={(data) =>
                editingPlan ? onUpdate(editingPlan.id, data) : onCreate(data)
              }
              onCancel={closeForm}
            />
          )}

          {actionError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}

          <div className="space-y-3">
            {plans.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                Este paciente aún no tiene un plan de remedios. Agrega el
                primero para programar las dosis y sus recordatorios.
              </p>
            ) : (
              plans.map((plan) => {
                const overdue = isMedicationPlanOverdue(plan);

                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-4 space-y-3 ${
                      plan.isActive
                        ? overdue
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-slate-950/60 border-slate-800"
                        : "bg-slate-950/30 border-slate-800/60 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-white">
                            {plan.productName}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-semibold">
                            {formatFractionWithUnit(
                              plan.dose,
                              plan.unit ?? "",
                            )}{" "}
                            cada {plan.frequencyHours} h
                          </span>
                          {!plan.isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-semibold">
                              Detenido
                            </span>
                          )}
                          {overdue && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">
                              Dosis atrasada
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {plan.isActive ? "Próxima dosis: " : "Última programación: "}
                          {formatDateTimeShort(plan.nextDoseAt)}
                          {plan.durationDays
                            ? ` · ${plan.durationDays} días`
                            : ""}
                        </p>

                        {plan.notes && (
                          <p className="text-xs text-slate-500 mt-1">
                            {plan.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {plan.isActive && (
                          <button
                            type="button"
                            onClick={() => handleAdminister(plan)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Pill className="w-3.5 h-3.5" /> Administrar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(plan);
                            setShowForm(true);
                          }}
                          title="Editar plan"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#ece883] hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleActive(plan.id, !plan.isActive)}
                          title={plan.isActive ? "Detener plan" : "Reactivar plan"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {plan.isActive ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeletePlanId(plan.id)}
                          title="Eliminar plan"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Historial de dosis: reemplaza al registro de medicación/consumo */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historial de dosis administradas
            </h3>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-950/40 border border-slate-800/60 rounded-xl p-4">
                Aún no se han administrado dosis. Cuando administres una dosis
                del plan, el registro aparecerá aquí.
              </p>
            ) : (
              <div className="space-y-2">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {medication.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTimeShort(medication.date)}
                        {medication.createdBy
                          ? ` • por ${medication.createdBy}`
                          : ""}
                      </p>
                      {medication.notes && (
                        <p className="text-xs text-slate-400 mt-1">
                          {medication.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#ece883] shrink-0">
                      {formatFractionWithUnit(
                        medication.dose ?? medication.quantity,
                        medication.doseUnit ?? medication.unit ?? "",
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Al administrar una dosis se descuenta automáticamente del inventario
            y se programa la siguiente según la frecuencia indicada.
          </p>
        </div>

        <div className="flex items-center justify-end p-6 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ActionConfirmModal
        show={Boolean(pendingAdminPlan)}
        title="Confirmar administración"
        description={
          pendingAdminPlan
            ? `¿Registrar la administración de ${pendingAdminPlan.productName} (${formatFractionWithUnit(
                pendingAdminPlan.dose,
                pendingAdminPlan.unit ?? "",
              )}) y descontarla del inventario?${
                allergies
                  ? ` ⚠️ Alergias del paciente: ${allergies}`
                  : ""
              }`
            : ""
        }
        confirmText="Sí, administrar"
        cancelText="No, volver"
        borderColor="border-emerald-500/40"
        iconBgColor="bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
        onConfirm={confirmAdminister}
        onCancel={() => setPendingAdminPlan(null)}
      />

      <ActionConfirmModal
        show={Boolean(pendingDeletePlanId)}
        title="Eliminar plan de remedios"
        description={`¿Eliminar el plan de ${
          pendingDeletePlan?.productName ?? "este remedio"
        }? El historial de dosis administradas se conserva.`}
        confirmText="Sí, eliminar"
        cancelText="No, volver"
        borderColor="border-red-500/40"
        iconBgColor="bg-red-500/20 border-red-500/40 text-red-300"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeletePlanId(null)}
      />
    </div>
  );
};
