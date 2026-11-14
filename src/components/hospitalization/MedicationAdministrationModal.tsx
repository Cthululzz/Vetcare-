import { useState } from "react";
import { AlertCircle, Pill, X } from "lucide-react";
import type { Patient } from "../../types/patient";
import type { InventoryItem } from "../../types/inventory";
import type { MedicationAdministration } from "../../types/hospitalization";
import {
  formatFraction,
  formatFractionWithUnit,
  formatPackageEquivalence,
  formatQuantityWithUnit,
  formatStockBreakdown,
} from "../../utils/inventoryUnits";

export interface MedicationAdministrationData {
  productId: string;
  /** Cantidad administrada, en la misma unidad con que se controla el stock. */
  quantity: number;
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

  const initialQuantity = initial
    ? initial.quantity > 0
      ? String(initial.quantity)
      : initial.dose != null
        ? String(initial.dose)
        : ""
    : "";

  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [quantity, setQuantity] = useState(initialQuantity);
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

  // Al editar, se devuelve primero el descuento anterior antes de aplicar el nuevo.
  const availableStock =
    (selectedProduct?.currentStock ?? 0) +
    (initial?.quantity ?? initial?.dose ?? 0);
  const parsedQuantity = Number(quantity);
  const remainingStock = Number.isFinite(parsedQuantity)
    ? Math.max(0, availableStock - parsedQuantity)
    : availableStock;
  const unit = selectedProduct?.unit ?? "";
  const supportsFractions = ["comprimido", "pastilla", "capsula"].includes(
    unit,
  );
  const remainingBreakdown = selectedProduct
    ? formatStockBreakdown({ ...selectedProduct, currentStock: remainingStock })
    : null;
  const packageEquivalence =
    selectedProduct && parsedQuantity > 0
      ? formatPackageEquivalence(parsedQuantity, selectedProduct)
      : null;

  if (!isOpen || !patient) return null;

  const resetForm = () => {
    setProductId("");
    setQuantity("");
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
      setError(
        "No hay productos con stock disponible. Registra un ingreso en Inventario.",
      );
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Ingresa una cantidad mayor a cero.");
      return;
    }

    if (parsedQuantity > availableStock) {
      setError(
        `Stock insuficiente: quedan ${formatQuantityWithUnit(
          availableStock,
          selectedProduct.unit,
        )}.`,
      );
      return;
    }

    const submitError = onAdminister({
      productId: selectedProduct.id,
      quantity: parsedQuantity,
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
                  ? "Editar Medicación o Consumo"
                  : "Registrar Medicación o Consumo"}
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
                    {product.name} —{" "}
                    {formatQuantityWithUnit(product.currentStock, product.unit)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Cantidad administrada / consumida *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setError("");
                  }}
                  placeholder="Ej. 5"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                />
                <span className="text-xs font-semibold text-[#ece883] shrink-0 min-w-12 text-right">
                  {unit || "—"}
                </span>
              </div>
              {supportsFractions && (
                <div className="flex gap-2 mt-2">
                  {[0.25, 0.5, 1, 2].map((fraction) => (
                    <button
                      key={fraction}
                      type="button"
                      onClick={() => {
                        setQuantity(String(fraction));
                        setError("");
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        parsedQuantity === fraction
                          ? "bg-[#ece883] text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {formatFraction(fraction)}
                    </button>
                  ))}
                </div>
              )}
              {parsedQuantity > 0 && unit && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Registro:{" "}
                  <span className="text-slate-300 font-semibold">
                    {formatFractionWithUnit(parsedQuantity, unit)}
                  </span>
                  {packageEquivalence ? ` (${packageEquivalence})` : ""}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isEditing ? "Stock disponible al ajustar" : "Stock disponible"}
              </label>
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                {selectedProduct
                  ? formatQuantityWithUnit(availableStock, selectedProduct.unit)
                  : "—"}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Anota cuánto se usó del producto: por ejemplo, 40 g de alimento, 5 ml
            de suspensión, ½ comprimido o 100 mg. Se descontará del inventario en
            la misma unidad del producto, como cuando se abre el envase y se
            consume hasta agotarlo.
            {selectedProduct &&
              Number.isFinite(parsedQuantity) &&
              parsedQuantity > 0 && (
                <>
                  {" "}
                  Quedarán{" "}
                  <span className="text-slate-300 font-semibold">
                    {formatQuantityWithUnit(remainingStock, selectedProduct.unit)}
                  </span>
                  {remainingBreakdown ? ` (${remainingBreakdown})` : ""} en stock.
                </>
              )}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Notas de administración o consumo
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
              ? "Al guardar se ajustará el stock según la nueva cantidad registrada."
              : "La cantidad registrada se restará automáticamente del stock total del producto."}
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
            {isEditing ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
};
