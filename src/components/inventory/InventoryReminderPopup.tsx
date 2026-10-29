import { useState, useEffect } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { useInventoryReminders } from "../../hooks/useInventoryReminders";
import { useInventoryMovements } from "../../hooks/useInventoryMovements";
import { useInventory } from "../../hooks/useInventory";

export const InventoryReminderPopup = () => {
  const { getRemindersToNotify, markAsNotified, dismissReminder } =
    useInventoryReminders();
  const { getPendingMovements, completeMovement } = useInventoryMovements();
  const { getProduct } = useInventory();

  const [isVisible, setIsVisible] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(
    null,
  );
  const [formData, setFormData] = useState({
    userName: "",
    userRole: "",
    reason: "",
    patientName: "",
  });

  const pendingReminders = getRemindersToNotify();
  const pendingMovements = getPendingMovements();

  // Verificar cada minuto si hay recordatorios que mostrar
  useEffect(() => {
    const checkReminders = () => {
      if (pendingReminders.length > 0 && !isVisible) {
        setIsVisible(true);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [pendingReminders, isVisible]);

  const selectedMovement = selectedMovementId
    ? pendingMovements.find((m) => m.id === selectedMovementId)
    : null;

  const selectedProduct = selectedMovement
    ? getProduct(selectedMovement.productId)
    : null;

  const handleComplete = () => {
    if (!selectedMovementId || !formData.userName || !formData.userRole) return;

    completeMovement(selectedMovementId, {
      userName: formData.userName,
      userRole: formData.userRole,
      reason: formData.reason || undefined,
      patientName: formData.patientName || undefined,
    });

    // Marcar recordatorio como notificado
    const reminder = pendingReminders.find(
      (r) => r.movementId === selectedMovementId,
    );
    if (reminder) {
      markAsNotified(reminder.id);
    }

    setSelectedMovementId(null);
    setFormData({ userName: "", userRole: "", reason: "", patientName: "" });

    // Si no hay más pendientes, cerrar popup
    if (pendingMovements.length <= 1) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isVisible || pendingMovements.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Bell className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Recordatorio de Inventario
              </h2>
              <p className="text-sm text-amber-400 mt-0.5">
                Hay {pendingMovements.length} retiro
                {pendingMovements.length > 1 ? "s" : ""} pendiente
                {pendingMovements.length > 1 ? "s" : ""} de información
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!selectedMovementId ? (
            // Lista de movimientos pendientes
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-4">
                Seleccione un retiro para completar la información:
              </p>
              {pendingMovements.map((movement) => {
                const product = getProduct(movement.productId);
                return (
                  <button
                    key={movement.id}
                    onClick={() => setSelectedMovementId(movement.id)}
                    className="w-full text-left bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 rounded-xl p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">
                          {product?.name || "Producto eliminado"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Cantidad: {movement.quantity}
                        </p>
                        <p className="text-xs text-slate-500">
                          Retirado por:{" "}
                          <span className="text-amber-400">
                            {movement.userName || "Usuario activo"}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500">
                          Fecha:{" "}
                          {formatDate(movement.pendingSince || movement.date)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                        Pendiente
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Formulario para completar información
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Producto:</p>
                <p className="text-sm font-bold text-white">
                  {selectedProduct?.name}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Cantidad retirada:
                </p>
                <p className="text-sm font-bold text-white">
                  {selectedMovement?.quantity}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre de quien retiró *
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    required
                    placeholder="Nombre completo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rol *
                  </label>
                  <input
                    type="text"
                    value={formData.userRole}
                    onChange={(e) =>
                      setFormData({ ...formData, userRole: e.target.value })
                    }
                    required
                    placeholder="Ej. Veterinario, Enfermero"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Motivo
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={2}
                    placeholder="Motivo del retiro..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Paciente (si aplica)
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData({ ...formData, patientName: e.target.value })
                    }
                    placeholder="Nombre del paciente"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800">
          {selectedMovementId ? (
            <>
              <button
                onClick={() => setSelectedMovementId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleComplete}
                disabled={!formData.userName || !formData.userRole}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-sm font-bold transition-colors shadow-lg shadow-[#ece883]/10 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Completar Información
              </button>
            </>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Ver más tarde
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
