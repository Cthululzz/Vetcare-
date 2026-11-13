import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { GlobalInventoryReminder } from "./GlobalInventoryReminder"; // ← AGREGAR

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
        <Outlet />
      </main>
      <GlobalInventoryReminder /> {/* ← AGREGAR */}
    </div>
  );
}
