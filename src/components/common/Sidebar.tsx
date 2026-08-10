// src/components/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
} from "lucide-react";

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
        <Link
          to="/"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname === "/"
              ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Inicio
        </Link>

        <Link
          to="/agenda"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname === "/agenda"
              ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Agenda
        </Link>

        <Link
          to="/pacientes"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname.startsWith("/pacientes")
              ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-4 h-4" />
          Pacientes
        </Link>

        <Link
          to="/inventario"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname === "/inventario"
              ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Package className="w-4 h-4" />
          Inventario y Farmacia
        </Link>

        <Link
          to="/configuracion"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            location.pathname === "/configuracion"
              ? "bg-[#ece883] text-slate-950 font-semibold shadow-lg shadow-[#ece883]/10"
              : "text-slate-300 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>
      </nav>
    </aside>
  );
};
