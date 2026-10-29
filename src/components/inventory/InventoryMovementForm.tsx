import { useState } from "react";
import { X, Save, Clock } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryMovements } from "../../hooks/useInventoryMovements";
import { useInventoryReminders } from "../../hooks/useInventoryReminders";
import type { MovementType } from "../../types/inventory";

interface InventoryMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export const InventoryMovementForm = ({
  isOpen,
  onClose,
  currentUserName = "Usuario",
  currentUserRole = "Veterinario",
}: InventoryMovementFormProps) => {
  const { getProducts } = useInventory();
  const { createMovement } = useInventoryMovements();
  const { createReminder } = useInventoryReminders();

  const [movementType, setMovementType] = useState<MovementType>("retiro");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [patientName, setPatientName] = useState("");
  const [userName, setUserName] = useState(currentUserName);
  const [userRole, setUserRole] = useState(currentUserRole);

  if (!isOpen) return null;

  const products = getProducts();

  const handleSubmit = (e: React.FormEvent, isComplete: boolean) => {
    e.preventDefault();

    const movement = createMovement({
      productId,
      type: movementType,
      quantity: parseFloat(quantity),
      reason: reason || undefined,
      userName: isComplete ? userName : undefined,
      userRole: isComplete ? userRole : undefined,
      patientName: patientName || undefined,
      isComplete,
    });

    // Si no está completo, crear recordatorio
    if (!isComplete) {
      createReminder(movement.id, currentUserName);
    }

    // Reset form
    setProductId("");
    setQuantity("");
    setReason("");
    setPatientName("");
    setUserName(currentUserName);
    setUserRole(currentUserRole);
    onClose();
  };

  const showUserInfo = movementType === "retiro";
  const showPatient = movementType === "retiro";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Registrar Movimiento de Inventario
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Ingrese los datos del movimiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  "ingreso",
                  "retiro",
                  "ajuste",
                  "vencimiento",
                  "devolucion",
                ] as MovementType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMovementType(type)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors capitalize ${
                    movementType === type
                      ? "bg-[#ece883] text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Producto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Producto *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Cantidad *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              placeholder="Ej. 10"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Motivo
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Motivo del movimiento..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
            />
          </div>

          {/* Información del Usuario (solo para retiros) */}
          {showUserInfo && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#ece883] uppercase tracking-wider">
                Información del Retiro
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    placeholder="Nombre de quien retira"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rol *
                  </label>
                  <input
                    type="text"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    required
                    placeholder="Ej. Veterinario"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paciente (solo para retiros) */}
          {showPatient && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Paciente (si aplica)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre del paciente"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-800">
          {showUserInfo ? (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-sm font-semibold transition-colors"
            >
              <Clock className="w-4 h-4" />
              Recuérdame más tarde
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10"
            >
              <Save className="w-4 h-4" />
              Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
