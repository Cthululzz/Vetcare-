import { useMemo } from "react";
import { AlertTriangle, PackageCheck, PackageX } from "lucide-react";
import type { InventoryItem } from "../../types/inventory";
import {
  formatQuantityDisplay,
  getStockDisplay,
} from "../../utils/inventoryUnits";
import { ReportKpiCard } from "./ReportKpiCard";

interface LowStockReportProps {
  /** Productos activos con stock menor o igual al mínimo, ya por sucursal. */
  items: InventoryItem[];
}

/** Ordena los productos críticos por la relación entre stock actual y mínimo. */
const criticidad = (item: InventoryItem): number =>
  item.minStock > 0 ? item.currentStock / item.minStock : 0;

/** Reporte de inventario con stock crítico; no depende del rango de fechas. */
export const LowStockReport = ({ items }: LowStockReportProps) => {
  const productos = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          criticidad(a) - criticidad(b) || a.name.localeCompare(b.name, "es"),
      ),
    [items],
  );

  const sinStock = useMemo(
    () => productos.filter((item) => item.currentStock === 0).length,
    [productos],
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-white">
            <AlertTriangle className="h-5 w-5 text-[#ece883]" />
            Stock crítico
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Productos activos con stock igual o inferior al mínimo. No se ve
            afectado por el rango de fechas.
          </p>
        </div>
        <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-300">
          {productos.length}{" "}
          {productos.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReportKpiCard
          label="Productos críticos"
          value={productos.length}
          icon={AlertTriangle}
          hint="Requieren revisión de reposición"
        />
        <ReportKpiCard
          label="Sin stock"
          value={sinStock}
          icon={PackageX}
          hint="Agotados en la sucursal activa"
        />
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#ece883]">
          Detalle de reposición
        </h3>
        {productos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 px-4 py-10 text-center">
            <PackageCheck className="mx-auto h-10 w-10 stroke-1 text-slate-600" />
            <p className="mt-3 text-sm text-slate-400">
              No hay productos con stock crítico en este momento.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Todos los productos activos superan su stock mínimo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Stock actual
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Stock mínimo
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {productos.map((item) => {
                  const stock = getStockDisplay(item);
                  const agotado = item.currentStock === 0;
                  return (
                    <tr key={item.id} className="text-slate-300">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="mt-0.5 text-[11px] capitalize text-slate-500">
                          {item.category}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold tabular-nums text-white">
                          {stock.primary}
                        </p>
                        {stock.detail ? (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {stock.detail}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatQuantityDisplay(item.minStock, item)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex rounded-lg border px-2 py-1 text-[11px] font-semibold ${
                            agotado
                              ? "border-red-500/20 bg-red-500/10 text-red-400"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {agotado ? "Sin stock" : "Stock bajo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
