import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";
import { PERMISSIONS, type Permission } from "../../utils/permissions";
import { ROLES_USUARIO } from "../../constants/appConstants";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  permissions?: Permission[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
    to: "/recetas",
    label: "Recetas",
    icon: Pill,
    exact: true,
    permissions: [PERMISSIONS.CLINICAL_HISTORY_VIEW],
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
    to: "/reportes",
    label: "Reportes",
    icon: ClipboardList,
    exact: true,
    permissions: [PERMISSIONS.REPORTS_VIEW],
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

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { canAny } = usePermissions();
  const { logout, user } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.permissions || canAny(item.permissions),
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4 transition-transform duration-200 select-none lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-700/60 px-2 pb-5 pt-3 mb-6">
          <div>
            <h1 className="font-black text-lg tracking-wider text-white">
              VET<span className="text-[#ece883]">CARE+</span>
            </h1>
            <p className="text-xs text-slate-300 font-semibold tracking-wide mt-0.5">
              Gestión Veterinaria
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
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
                onClick={onClose}
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

        <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
          {user && (
            <div className="min-w-0 rounded-xl bg-slate-950/60 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {ROLES_USUARIO[user.role]}
              </p>
            </div>
          )}

          <Link
            to="/mi-cuenta"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <UserRound className="h-4 w-4" />
            Mi cuenta
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};
