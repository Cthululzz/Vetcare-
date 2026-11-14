import { useState } from "react";
import { AlertCircle, Pill, X } from "lucide-react";
import type { Patient } from "../../types/patient";
import type { InventoryItem } from "../../types/inventory";
import type { MedicationAdministration } from "../../types/hospitalization";
import {
  DEFAULT_DOSE_UNIT,
  UNIDADES_DOSIS,
} from "../../constants/hospitalization";

export interface MedicationAdministrationData {
  productId: string;
  /** Dosis clínica administrada (ej. 1 pastilla, 5 ml). */
  dose: number;
  doseUnit: string;
  /** Unidades de inventario a descontar. 0 = no descontar stock. */
  stockQuantity: number;
  notes?: string;
}

interface MedicationAdministrationModalProps {
  isOpen: boolean;
  patient: Patient | null;
  products: InventoryItem[];
  /** Registro existente cuando se está editando una administración. */
  initial?: MedicationAdministration | null;
  onAdminister: (data: MedicationAdministrationData) => string | null;
  onClose: () => void;
}

export const MedicationAdministrationModal = ({
  isOpen,
  patient,
  products,
  initial = null,
  onAdminister,
  onClose,
}: MedicationAdministrationModalProps) => {
  const isEditing = Boolean(initial);

  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [dose, setDose] = useState(
    initial ? String(initial.dose ?? initial.quantity ?? "") : "1",
  );
  const [doseUnit, setDoseUnit] = useState(
    initial?.doseUnit ?? initial?.unit ?? DEFAULT_DOSE_UNIT,
  );
  const [stockQuantity, setStockQuantity] = useState(
    initial ? String(initial.quantity ?? 0) : "0",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const selectableProducts = products.filter(
    (product) =>
      (product.isActive && product.currentStock > 0) ||
      product.id === initial?.productId,
  );

  const selectedProduct =
    selectableProducts.find((product) => product.id === productId) ??
    selectableProducts[0];

  const doseUnitOptions = UNIDADES_DOSIS.some(
    (unit) => unit.value === doseUnit,
  )
    ? UNIDADES_DOSIS
    : [
        ...UNIDADES_DOSIS,
        { value: doseUnit, label: doseUnit || "unidad" },
      ];

  // Al editar, se devuelve primero el descuento anterior antes de aplicar el nuevo.
  const availableStock =
    (selectedProduct?.currentStock ?? 0) + (initial?.quantity ?? 0);

  if (!isOpen || !patient) return null;

  const resetForm = () => {
    setProductId("");
    setDose("1");
    setDoseUnit(DEFAULT_DOSE_UNIT);
    setStockQuantity("0");
    setNotes("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProduct) {
      setError("No hay productos con stock disponible en inventario.");
      return;
    }

    const parsedDose = Number(dose);
    if (!Number.isFinite(parsedDose) || parsedDose <= 0) {
      setError("Ingresa una dosis válida mayor a cero.");
      return;
    }

    const parsedStockQuantity = Number(stockQuantity || 0);
    if (!Number.isFinite(parsedStockQuantity) || parsedStockQuantity < 0) {
      setError("El descuento de inventario no puede ser negativo.");
      return;
    }
    if (parsedStockQuantity > availableStock) {
      setError(
        `Stock insuficiente: quedan ${availableStock} ${selectedProduct.unit}.`,
      );
      return;
    }

    const submitError = onAdminister({
      productId: selectedProduct.id,
      dose: parsedDose,
      doseUnit,
      stockQuantity: parsedStockQuantity,
      notes: notes.trim() || undefined,
    });

    if (submitError) {
      setError(submitError);
      return;
    }

    resetForm();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing
                  ? "Editar Medicación Administrada"
                  : "Administrar Medicación"}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Paciente:{" "}
                <span className="text-white font-medium">{patient.name}</span>
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
          id="medication-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Producto de inventario *
            </label>
            <select
              value={selectedProduct?.id ?? ""}
              onChange={(event) => {
                setProductId(event.target.value);
                setError("");
              }}
              disabled={selectableProducts.length === 0 || isEditing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors disabled:text-slate-500"
            >
              {selectableProducts.length === 0 ? (
                <option value="">Sin stock disponible</option>
              ) : (
                selectableProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — {product.currentStock} {product.unit}
                  </option>
                ))
              )}
            </select>
            {isEditing && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                El producto no se puede cambiar. Si necesitas otro, elimina este
                registro y agrega uno nuevo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Dosis administrada *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={dose}
                onChange={(event) => {
                  setDose(event.target.value);
                  setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Unidad de la dosis *
              </label>
              <select
                value={doseUnit}
                onChange={(event) => {
                  setDoseUnit(event.target.value);
                  setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                {doseUnitOptions.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Descontar de inventario
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={stockQuantity}
                  onChange={(event) => {
                    setStockQuantity(event.target.value);
                    setError("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
                />
                <span className="text-xs text-slate-400 shrink-0">
                  {selectedProduct?.unit ?? "—"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isEditing ? "Stock disponible al ajustar" : "Stock disponible"}
              </label>
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                {selectedProduct
                  ? `${availableStock} ${selectedProduct.unit}`
                  : "—"}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            La dosis es lo que recibe el paciente (por ejemplo, 1 pastilla o 5
            ml). El descuento de inventario es independiente: usa{" "}
            <span className="text-slate-300">0</span> si no corresponde descontar
            stock (por ejemplo, cuando el inventario se lleva por caja).
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Notas de administración
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Vía, frecuencia, observaciones..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            {isEditing
              ? "Al guardar se ajustará el stock según la diferencia entre el descuento anterior y el nuevo."
              : "Si indicas un descuento mayor a 0, se registrará un retiro en inventario con el nombre del paciente."}
          </p>

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
            form="medication-form"
            disabled={selectableProducts.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            {isEditing ? "Guardar Cambios" : "Registrar Administración"}
          </button>
        </div>
      </div>
    </div>
  );
};
