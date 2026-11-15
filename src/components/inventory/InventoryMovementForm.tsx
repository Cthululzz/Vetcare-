import { useState } from "react";
import { AlertTriangle, X, Save, Clock } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import { useInventoryMovements } from "../../hooks/useInventoryMovements";
import { useInventoryReminders } from "../../hooks/useInventoryReminders";
import type { MovementType } from "../../types/inventory";
import {
  formatPackageEquivalence,
  formatPackagePlural,
  formatQuantity,
  formatQuantityDisplay,
  formatQuantityWithUnit,
  getContentInBaseUnit,
  getStockDisplay,
  isMeasuredUnit,
} from "../../utils/inventoryUnits";

interface InventoryMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserName?: string;
  currentUserRole?: string;
}

type InputMode = "packages" | "base";

const roundQuantity = (value: number): number => Math.round(value * 100) / 100;

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
  const [inputMode, setInputMode] = useState<InputMode>("packages");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [patientName, setPatientName] = useState("");
  const [userName, setUserName] = useState(currentUserName);
  const [userRole, setUserRole] = useState(currentUserRole);
  const [error, setError] = useState("");
  const [stockWarning, setStockWarning] = useState<
    { kind: "ajuste"; isComplete: boolean } | { kind: "insuficiente" } | null
  >(null);

  if (!isOpen) return null;

  const products = getProducts();
  const selectedProduct = products.find((product) => product.id === productId);
  const contentInBaseUnit = selectedProduct
    ? getContentInBaseUnit(selectedProduct)
    : null;
  const canUsePackages = Boolean(
    movementType !== "ajuste" &&
      selectedProduct?.packageType &&
      contentInBaseUnit &&
      contentInBaseUnit > 0,
  );
  const effectiveInputMode: InputMode = canUsePackages ? inputMode : "base";

  const parsedInput = Number(quantity || 0);
  const baseQuantity =
    effectiveInputMode === "packages" && contentInBaseUnit
      ? parsedInput * contentInBaseUnit
      : parsedInput;

  const unit = selectedProduct?.unit ?? "";
  const packageLabel = selectedProduct?.packageType
    ? formatPackagePlural(selectedProduct.packageType, 0)
    : "envases";

  const currentStock = selectedProduct?.currentStock ?? 0;
  const resultingStock =
    movementType === "ingreso" || movementType === "devolucion"
      ? currentStock + baseQuantity
      : movementType === "ajuste"
        ? baseQuantity
        : Math.max(0, currentStock - baseQuantity);

  const stockDisplay = selectedProduct ? getStockDisplay(selectedProduct) : null;
  const resultingDisplay = selectedProduct
    ? getStockDisplay({ ...selectedProduct, currentStock: resultingStock })
    : null;

  const subtractsStock =
    movementType === "retiro" ||
    movementType === "vencimiento" ||
    movementType === "merma";

  const adjustmentDifference = selectedProduct
    ? roundQuantity(selectedProduct.currentStock - baseQuantity)
    : 0;
  const adjustmentMissing = adjustmentDifference > 0;
  const adjustmentDifferenceDisplay = selectedProduct
    ? formatQuantityDisplay(Math.abs(adjustmentDifference), selectedProduct)
    : "";

  const shortageDifference = selectedProduct
    ? roundQuantity(baseQuantity - selectedProduct.currentStock)
    : 0;
  const shortageDisplay = selectedProduct
    ? formatQuantityDisplay(shortageDifference, selectedProduct)
    : "";
  const requestedDisplay = selectedProduct
    ? getStockDisplay({ ...selectedProduct, currentStock: baseQuantity })
    : null;

  const resetForm = () => {
    setProductId("");
    setInputMode("packages");
    setQuantity("");
    setReason("");
    setPatientName("");
    setUserName(currentUserName);
    setUserRole(currentUserRole);
    setError("");
    setStockWarning(null);
  };

  const submitMovement = (isComplete: boolean) => {
    if (!selectedProduct) return;

    const movement = createMovement({
      productId,
      type: movementType,
      quantity: roundQuantity(baseQuantity),
      unit: selectedProduct.unit,
      packageQuantity:
        effectiveInputMode === "packages" ? parsedInput : undefined,
      packageType:
        effectiveInputMode === "packages"
          ? selectedProduct.packageType
          : undefined,
      packageContent:
        effectiveInputMode === "packages"
          ? selectedProduct.contentPerPackage
          : undefined,
      packageContentUnit:
        effectiveInputMode === "packages"
          ? selectedProduct.contentUnit
          : undefined,
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

    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent, isComplete: boolean) => {
    e.preventDefault();
    setError("");

    if (!selectedProduct) {
      setError("Selecciona un producto del inventario.");
      return;
    }

    if (!Number.isFinite(parsedInput) || parsedInput <= 0) {
      setError("Ingresa una cantidad mayor a cero.");
      return;
    }

    if (
      subtractsStock &&
      roundQuantity(baseQuantity) > selectedProduct.currentStock
    ) {
      setStockWarning({ kind: "insuficiente" });
      return;
    }

    // En un ajuste, si el conteo no coincide con el sistema, se pide confirmar.
    if (movementType === "ajuste" && Math.abs(adjustmentDifference) > 0.01) {
      setStockWarning({ kind: "ajuste", isComplete });
      return;
    }

    submitMovement(isComplete);
  };

  const handleConfirmAdjustment = () => {
    if (stockWarning?.kind !== "ajuste") return;
    const pending = stockWarning;
    setStockWarning(null);
    submitMovement(pending.isComplete);
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
                  "merma",
                ] as MovementType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setMovementType(type);
                    setInputMode(type === "ajuste" ? "base" : "packages");
                    setError("");
                  }}
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
              onChange={(e) => {
                setProductId(e.target.value);
                setQuantity("");
                setError("");
              }}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ece883] transition-colors"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {getStockDisplay(p).primary})
                </option>
              ))}
            </select>
          </div>

          {/* Modo de ingreso por envases */}
          {canUsePackages && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ingresar en:
              </span>
              <button
                type="button"
                onClick={() => {
                  setInputMode("packages");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  effectiveInputMode === "packages"
                    ? "bg-[#ece883] text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {packageLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputMode("base");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  effectiveInputMode === "base"
                    ? "bg-[#ece883] text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {unit}
              </button>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {effectiveInputMode === "packages"
                ? movementType === "ingreso"
                  ? `Cantidad recibida (${packageLabel})`
                  : `Cantidad (${packageLabel})`
                : movementType === "ajuste"
                  ? `Nuevo stock total (${unit || "unidad"})`
                  : `Cantidad (${unit || "unidad"})`}{" "}
              *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              required
              placeholder={
                effectiveInputMode === "packages"
                  ? "Ej. 25"
                  : `Ej. 10 ${unit}`
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
            {movementType === "merma" && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Merma: descarte de un envase abierto, derrame o producto en mal
                estado. Se descuenta del stock total.
              </p>
            )}
            {selectedProduct && parsedInput > 0 && (
              <div className="text-[11px] text-slate-500 mt-1.5 space-y-0.5">
                {effectiveInputMode === "packages" && contentInBaseUnit && (
                  <p>
                    ={" "}
                    <span className="text-slate-300 font-semibold">
                      {formatQuantityWithUnit(baseQuantity, selectedProduct.unit)}
                    </span>{" "}
                    ({formatQuantity(parsedInput)} {packageLabel} ×{" "}
                    {formatQuantity(selectedProduct.contentPerPackage ?? 0)}{" "}
                    {selectedProduct.contentUnit})
                  </p>
                )}
                {effectiveInputMode === "base" &&
                  isMeasuredUnit(selectedProduct.unit) &&
                  formatPackageEquivalence(baseQuantity, selectedProduct) && (
                    <p>
                      {formatPackageEquivalence(baseQuantity, selectedProduct)}
                    </p>
                  )}
                <p>
                  Stock actual:{" "}
                  <span className="text-slate-300 font-semibold">
                    {stockDisplay?.primary}
                  </span>
                </p>
                <p>
                  Quedará:{" "}
                  <span className="text-slate-300 font-semibold">
                    {resultingDisplay?.primary}
                  </span>
                  {resultingDisplay?.detailLabel === "Total interno" &&
                  resultingDisplay.detail
                    ? ` (${resultingDisplay.detail})`
                    : ""}
                </p>
                {resultingDisplay?.detailLabel === "Equivale a" &&
                  resultingDisplay.detail && (
                    <p>
                      {resultingDisplay.detailLabel}:{" "}
                      {resultingDisplay.detail}
                    </p>
                  )}
              </div>
            )}
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs">
              {error}
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

      {/* Pop up de diferencias de stock (ajuste o stock insuficiente) */}
      {stockWarning && selectedProduct && stockDisplay && resultingDisplay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-start gap-3 p-6 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {stockWarning.kind === "ajuste"
                    ? "El stock no coincide"
                    : "Stock insuficiente"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {stockWarning.kind === "ajuste"
                    ? "El conteo ingresado es distinto al stock del sistema."
                    : "La cantidad solicitada supera lo disponible. No se registrará el movimiento."}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">
                  {stockWarning.kind === "ajuste"
                    ? "Stock del sistema"
                    : "Disponible"}
                </span>
                <span className="text-right font-semibold text-white">
                  {stockDisplay.primary}
                  {stockDisplay.detail && (
                    <span className="block text-[11px] text-slate-500">
                      {stockDisplay.detail}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">
                  {stockWarning.kind === "ajuste"
                    ? "Conteo ingresado"
                    : "Solicitado"}
                </span>
                <span className="text-right font-semibold text-white">
                  {(stockWarning.kind === "ajuste"
                    ? resultingDisplay
                    : requestedDisplay
                  )?.primary ?? "—"}
                  {(stockWarning.kind === "ajuste"
                    ? resultingDisplay
                    : requestedDisplay
                  )?.detail && (
                    <span className="block text-[11px] text-slate-500">
                      {
                        (stockWarning.kind === "ajuste"
                          ? resultingDisplay
                          : requestedDisplay
                        )?.detail
                      }
                    </span>
                  )}
                </span>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
                <span className="font-bold">
                  {stockWarning.kind === "ajuste"
                    ? `${adjustmentMissing ? "Faltan" : "Sobran"} ${adjustmentDifferenceDisplay}`
                    : `Faltan ${shortageDisplay}`}
                </span>
                <p className="text-[11px] text-amber-200/70 mt-1">
                  {stockWarning.kind === "ajuste"
                    ? `Al confirmar, el stock quedará en ${resultingDisplay.primary}.`
                    : "Ajusta la cantidad o registra un ingreso antes de continuar."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
              {stockWarning.kind === "ajuste" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStockWarning(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Volver a contar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAdjustment}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Registrar ajuste
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStockWarning(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors cursor-pointer"
                >
                  Corregir cantidad
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
