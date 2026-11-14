import { useState } from "react";
import { AlertCircle, Pill, X } from "lucide-react";
import type { Patient } from "../../types/patient";
import type { InventoryItem } from "../../types/inventory";

export interface MedicationAdministrationData {
  productId: string;
  quantity: number;
  notes?: string;
}

interface MedicationAdministrationModalProps {
  isOpen: boolean;
  patient: Patient | null;
  products: InventoryItem[];
  onAdminister: (data: MedicationAdministrationData) => string | null;
  onClose: () => void;
}

export const MedicationAdministrationModal = ({
  isOpen,
  patient,
  products,
  onAdminister,
  onClose,
}: MedicationAdministrationModalProps) => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const selectableProducts = products.filter(
    (product) => product.isActive && product.currentStock > 0,
  );

  const selectedProduct =
    selectableProducts.find((product) => product.id === productId) ??
    selectableProducts[0];

  if (!isOpen || !patient) return null;

  const resetForm = () => {
    setProductId("");
    setQuantity("1");
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

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setError("Ingresa una cantidad válida mayor a cero.");
      return;
    }
    if (parsedQuantity > selectedProduct.currentStock) {
      setError(
        `Stock insuficiente: quedan ${selectedProduct.currentStock} ${selectedProduct.unit}.`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Administrar Medicación
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
              disabled={selectableProducts.length === 0}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Cantidad *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Stock actual
              </label>
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                {selectedProduct
                  ? `${selectedProduct.currentStock} ${selectedProduct.unit}`
                  : "—"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Notas de administración
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Vía, dosis, observaciones..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Al confirmar se registrará un movimiento de retiro en inventario con
            el nombre del paciente y se descontará el stock.
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
            Registrar Administración
          </button>
        </div>
      </div>
    </div>
  );
};
