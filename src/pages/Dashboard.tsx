import { useNavigate } from "react-router-dom";
import GreetingBanner from "../components/common/GreetingBanner";
import { Footer } from "../components/common/Footer";
import { useAppointments } from "../hooks/useAppointments";
import { OperationalSummary } from "../components/dashboard/OperationalSummary";
import { NextPatientCard } from "../components/dashboard/NextPatientCard";
import { StockAlertCard } from "../components/inventory/StockAlertCardImproved";
import { QuickAccessBar } from "../components/dashboard/QuickAccessBar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { proximoPaciente } = useAppointments();

  const totalTareasPendientes = 5;
  const totalAlertasActivas = 4;

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6">
        <div className="[&>div]:py-3.5">
          <GreetingBanner />
        </div>

        <OperationalSummary
          tareas={totalTareasPendientes}
          alertas={totalAlertasActivas}
          onNavigate={navigate}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proximoPaciente ? (
            <NextPatientCard
              appointment={proximoPaciente}
              onNavigate={navigate}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 flex items-center justify-center text-slate-400 text-sm min-h-[240px]">
              No hay próximos pacientes programados para hoy.
            </div>
          )}
          <StockAlertCard onNavigate={navigate} />
        </div>

        <QuickAccessBar onNavigate={navigate} />
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
