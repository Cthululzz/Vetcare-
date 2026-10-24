// src/components/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer"; // Asegúrate de importar el Footer aquí

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Área principal con scroll donde se renderizan las rutas y el footer */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
        <div className="flex-1 p-6 lg:p-8">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}
