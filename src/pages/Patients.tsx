// src/pages/Patients.tsx
import { useNavigate } from "react-router-dom";
import { Users, BedDouble, Activity, Bell, ChevronRight } from "lucide-react";
import { Footer } from "../components/common/Footer";

interface PatientsProps {
  patients?: any[]; // Lista completa de pacientes de tu base o estado global
  hospitalizedPatients?: any[]; // Lista de pacientes hospitalizados
}

export const Patients = ({
  patients = [],
  hospitalizedPatients = [],
}: PatientsProps) => {
  const navigate = useNavigate();

  // Contadores reales basados en la longitud de los arrays
  const totalFichas = patients.length;
  const pacientesHospitalizadosCount = hospitalizedPatients.length;

  // Puedes dejar un valor por defecto o calcularlo de notas reales si las tienes
  const recordatoriosActivos = 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Gestión de Pacientes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Selecciona un módulo para administrar fichas, contactos o pacientes
            en área de internación.
          </p>
        </div>

        {/* Grid de las 2 Tarjetas Grandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* TARJETA 1: Fichas y Contactos */}
          <div
            onClick={() => navigate("/pacientes/fichas")}
            className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer overflow-hidden min-h-[320px]"
          >
            <div className="pointer-events-none absolute w-[250px] h-[250px] bg-blue-500/10 blur-[90px] rounded-full -bottom-10 -right-10 group-hover:bg-blue-500/20 transition-all duration-300" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Fichas y Contactos
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed">
                Directorio general de pacientes, expedientes clínicos,
                propietarios, historial de citas pasadas y datos de contacto
                rápido.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-6 mt-6 border-t border-slate-800/80">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300">
                {totalFichas}{" "}
                {totalFichas === 1
                  ? "registro guardado"
                  : "registros guardados"}
              </span>
              <div className="flex items-center gap-1 text-sm font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>Acceder</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* TARJETA 2: Hospitalizados */}
          <div
            onClick={() => navigate("/pacientes/hospitalizados")}
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer overflow-hidden min-h-[320px]"
          >
            <div className="pointer-events-none absolute w-[250px] h-[250px] bg-emerald-500/10 blur-[90px] rounded-full -bottom-10 -right-10 group-hover:bg-emerald-500/20 transition-all duration-300" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <BedDouble className="w-7 h-7" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Hospitalizados
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed">
                Monitoreo activo de pacientes internados, gestión de evoluciones
                clínicas, notas de enfermería y control de recordatorios
                médicos.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-6 mt-6 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  {pacientesHospitalizadosCount}{" "}
                  {pacientesHospitalizadosCount === 1
                    ? "internado"
                    : "internados"}
                </span>
                {recordatoriosActivos > 0 && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    {recordatoriosActivos} avisos
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Monitorear</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Patients;
