// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
  { to: "/agenda", label: "Agenda", icon: Calendar, exact: true },
  { to: "/pacientes", label: "Pacientes", icon: Users, exact: false }, // usa startsWith
  {
    to: "/inventario",
    label: "Inventario y Farmacia",
    icon: Package,
    exact: true,
  },
  { to: "/configuracion", label: "Configuración", icon: Settings, exact: true },
];

export const Sidebar = () => {
  const location = useLocation();

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
        {navItems.map(({ to, label, icon: Icon, exact }) => {
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
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
