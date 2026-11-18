import { Outlet } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { GlobalInventoryReminder } from "./GlobalInventoryReminder";
import { useBranchScope } from "../../context/branchScope";
import { SUCURSALES, getSucursalName } from "../../constants/appConstants";

export default function AppLayout() {
  const { activeBranch, canViewAll, setActiveBranch } = useBranchScope();
  const sucursalActiva =
    activeBranch === "all" ? null : getSucursalName(activeBranch);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-y-auto bg-slate-950 p-6 [scrollbar-gutter:stable] lg:p-8">
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
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#ece883]"
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
        <div className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </div>
      </main>
      <GlobalInventoryReminder />
    </div>
  );
}
