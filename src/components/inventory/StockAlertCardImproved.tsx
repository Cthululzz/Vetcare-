import { useState } from "react";
import { PackageX, ChevronRight, X, AlertTriangle } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";

interface StockAlertCardProps {
  onNavigate: (path: string) => void;
}

export const StockAlertCard = ({ onNavigate }: StockAlertCardProps) => {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const { getLowStockProducts } = useInventory();

  const lowStockProducts = getLowStockProducts()
    .sort((a, b) => {
      // Ordenar por porcentaje de stock (más crítico primero)
      const percentA = a.minStock > 0 ? a.currentStock / a.minStock : 0;
      const percentB = b.minStock > 0 ? b.currentStock / b.minStock : 0;
      return percentA - percentB;
    })
    .slice(0, 3); // Top 3 más críticos

  const allLowStock = getLowStockProducts().sort((a, b) => {
    const percentA = a.minStock > 0 ? a.currentStock / a.minStock : 0;
    const percentB = b.minStock > 0 ? b.currentStock / b.minStock : 0;
    return percentA - percentB;
  });

  if (lowStockProducts.length === 0) return null;

  return (
    <>
      <div
        onClick={() => setShowAllAlerts(true)}
        className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-7 transition-all cursor-pointer group shadow-sm flex flex-col justify-between min-h-[240px]"
      >
        <div className="pointer-events-none absolute w-[300px] h-[300px] bg-red-500/10 blur-[100px] rounded-full -bottom-16 -right-16 group-hover:bg-red-500/20 transition-all" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <PackageX className="w-5 h-5 text-[#ece883]" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Alerta de Stock
              </h3>
            </div>
            <span className="bg-amber-500/10 text-[#ece883] border border-amber-500/20 text-xs px-3 py-1 rounded-lg font-medium">
              {allLowStock.length}{" "}
              {allLowStock.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#ece883] transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Mínimo:{" "}
                      <span className="text-slate-300 font-medium">
                        {product.minStock} {product.unit}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-red-400">
                      {product.currentStock}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {product.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-medium text-[#ece883] group-hover:underline">
          <span>Ver todos los productos con stock bajo</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Modal con todos los productos en bajo stock */}
      {showAllAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Productos con Stock Bajo
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {allLowStock.length} productos requieren atención
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllAlerts(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {allLowStock.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        Stock mínimo: {product.minStock} {product.unit}
                      </p>
                      {product.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-red-400">
                        {product.currentStock}
                      </span>
                      <p className="text-xs text-slate-400">{product.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setShowAllAlerts(false);
                  onNavigate("/inventario");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors"
              >
                Ir a Inventario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
