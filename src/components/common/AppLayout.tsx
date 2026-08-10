// src/components/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Área principal donde se renderizarán las rutas hijas */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}
