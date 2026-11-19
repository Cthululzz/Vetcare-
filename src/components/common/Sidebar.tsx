// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";
import { isBypassAuthEnabled } from "../../utils/authBypass";
import { PERMISSIONS, type Permission } from "../../utils/permissions";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  permissions?: Permission[];
}

const navItems: NavItem[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
  {
    to: "/agenda",
    label: "Agenda",
    icon: Calendar,
    exact: true,
    permissions: [PERMISSIONS.APPOINTMENTS_VIEW],
  },
  {
    to: "/pacientes",
    label: "Pacientes",
    icon: Users,
    exact: false, // usa startsWith
    permissions: [PERMISSIONS.PATIENTS_VIEW],
  },
  {
    to: "/tareas",
    label: "Tareas y Alertas",
    icon: Bell,
    exact: true,
    permissions: [PERMISSIONS.CLINICAL_HISTORY_VIEW],
  },
  {
    to: "/inventario",
    label: "Inventario y Farmacia",
    icon: Package,
    exact: true,
    permissions: [PERMISSIONS.INVENTORY_VIEW],
  },
  {
    to: "/configuracion",
    label: "Configuración",
    icon: Settings,
    exact: true,
    permissions: [PERMISSIONS.SYSTEM_ADMIN, PERMISSIONS.LICENSE_MANAGE],
  },
  {
    to: "/proveedor",
    label: "Consola de proveedor",
    icon: ShieldCheck,
    exact: true,
    permissions: [PERMISSIONS.LICENSE_MANAGE],
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const { canAny } = usePermissions();
  const { logout } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.permissions || canAny(item.permissions),
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen p-4 select-none">
      <div className="px-2 py-3 mb-6 border-b border-slate-700/60 pb-5">
        <h1 className="font-black text-lg tracking-wider text-white">
          VET<span className="text-[#ece883]">CARE+</span>
        </h1>
        <p className="text-xs text-slate-300 font-semibold tracking-wide mt-0.5">
          Gestión Veterinaria
        </p>
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
        {visibleItems.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {!isBypassAuthEnabled() && (
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      )}
    </aside>
  );
};
