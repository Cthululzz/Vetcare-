import { useState } from "react";
import { X, Filter, Search } from "lucide-react";
import { useInventoryMovements } from "../../hooks/useInventoryMovements";
import { useInventory } from "../../hooks/useInventory";
import type { MovementType } from "../../types/inventory";

interface InventoryMovementHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryMovementHistory = ({
  isOpen,
  onClose,
}: InventoryMovementHistoryProps) => {
  const { getMovements } = useInventoryMovements();
  const { getProduct } = useInventory();

  const [filters, setFilters] = useState({
    type: "" as MovementType | "",
    userName: "",
    productId: "",
    startDate: "",
    endDate: "",
    pendingOnly: false,
  });

  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const movements = getMovements({
    type: filters.type || undefined,
    userName: filters.userName || undefined,
    productId: filters.productId || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    pendingOnly: filters.pendingOnly,
  });

  const filteredMovements = searchQuery.trim()
    ? movements.filter((m) => {
        const product = getProduct(m.productId);
        const query = searchQuery.toLowerCase();
        return (
          product?.name.toLowerCase().includes(query) ||
          m.userName?.toLowerCase().includes(query) ||
          m.reason?.toLowerCase().includes(query)
        );
      })
    : movements;

  const getMovementTypeLabel = (type: MovementType) => {
    const labels: Record<MovementType, string> = {
      ingreso: "Ingreso",
      retiro: "Retiro",
      ajuste: "Ajuste",
      vencimiento: "Vencimiento",
      devolucion: "Devolución",
    };
    return labels[type];
  };

  const getMovementTypeColor = (type: MovementType) => {
    const colors: Record<MovementType, string> = {
      ingreso: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      retiro: "bg-red-500/10 text-red-400 border-red-500/20",
      ajuste: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      vencimiento: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      devolucion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[type];
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Historial de Movimientos
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Registro completo de auditoría
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por producto, usuario o motivo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    type: e.target.value as MovementType | "",
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ece883] transition-colors"
              >
                <option value="">Todos</option>
                <option value="ingreso">Ingreso</option>
                <option value="retiro">Retiro</option>
                <option value="ajuste">Ajuste</option>
                <option value="vencimiento">Vencimiento</option>
                <option value="devolucion">Devolución</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Usuario
              </label>
              <input
                type="text"
                value={filters.userName}
                onChange={(e) =>
                  setFilters({ ...filters, userName: e.target.value })
                }
                placeholder="Nombre..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ece883] transition-colors"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pendingOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, pendingOnly: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-[#ece883] focus:ring-[#ece883]"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Solo pendientes
                </span>
              </label>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    type: "",
                    userName: "",
                    productId: "",
                    startDate: "",
                    endDate: "",
                    pendingOnly: false,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
              <p className="text-sm text-slate-400">
                No hay movimientos que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Fecha
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Producto
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Tipo
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Cantidad
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Usuario
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Paciente
                    </th>
                    <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredMovements.map((movement) => {
                    const product = getProduct(movement.productId);
                    return (
                      <tr
                        key={movement.id}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 text-xs text-slate-300">
                          {formatDate(movement.date)}
                        </td>
                        <td className="py-3 text-sm font-medium text-white">
                          {product?.name || "Producto eliminado"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-md border font-medium ${getMovementTypeColor(
                              movement.type,
                            )}`}
                          >
                            {getMovementTypeLabel(movement.type)}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-slate-300">
                          {movement.quantity}
                        </td>
                        <td className="py-3 text-sm text-slate-300">
                          {movement.userName || (
                            <span className="text-amber-400 italic">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-slate-300">
                          {movement.patientName || "-"}
                        </td>
                        <td className="py-3">
                          {movement.isComplete ? (
                            <span className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Completo
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
