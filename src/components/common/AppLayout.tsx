import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { MapPin, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GlobalInventoryReminder } from "./GlobalInventoryReminder";
import { LicenseStatusBanner } from "../license/LicenseStatusBanner";
import { useBranchScope } from "../../context/branchScope";
import { usePermissions } from "../../hooks/usePermissions";
import { SUCURSALES, getSucursalName } from "../../constants/appConstants";
import { PERMISSIONS } from "../../utils/permissions";

export default function AppLayout() {
  const { activeBranch, canViewAll, setActiveBranch } = useBranchScope();
  const { role, can } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sucursalActiva =
    activeBranch === "all" ? null : getSucursalName(activeBranch);
  const esProveedor = role === "PROVEEDOR";

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-slate-950 p-6 [scrollbar-gutter:stable] lg:p-8">
        <div className="mb-4 flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de navegación"
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-[#ece883] transition-colors hover:border-[#ece883]/40"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-black tracking-wider text-white">
            VET<span className="text-[#ece883]">CARE+</span>
          </span>
        </div>

        <LicenseStatusBanner />
        {!esProveedor && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="h-4 w-4 text-[#ece883] shrink-0" />
              <span className="font-semibold uppercase tracking-wider text-xs">
                Sucursal activa
              </span>
              {!canViewAll && sucursalActiva && (
                <span className="text-slate-400">· {sucursalActiva}</span>
              )}
            </div>

            {canViewAll && (
              <select
                id="sucursal-activa"
                aria-label="Sucursal activa"
                value={activeBranch}
                onChange={(event) => setActiveBranch(event.target.value)}
                className="min-w-0 max-w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#ece883]"
              >
                <option value="all">Todas las sucursales</option>
                {SUCURSALES.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
                Cargando sección...
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      {can(PERMISSIONS.INVENTORY_MANAGE) && <GlobalInventoryReminder />}
    </div>
  );
}
