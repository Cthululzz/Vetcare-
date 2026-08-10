// src/pages/HospitalizationView.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BedDouble,
  Activity,
  Bell,
  ArrowLeft,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Footer } from "../components/common/Footer";

export const HospitalizationView = () => {
  const navigate = useNavigate();

  // Lista simulada de pacientes hospitalizados (puedes conectarla a tu estado real o hook)
  const [pacientesHospitalizados, setPacientesHospitalizados] = useState([
    {
      id: "1",
      paciente: "Max",
      tipoMascota: "Perro (Golden Retriever)",
      propietario: "Carlos Mendoza",
      motivoIngreso: "Post-operatorio de displasia de cadera",
      fechaIngreso: "Ayer, 14:00 hrs",
      cama: "Cama 01 - UTI",
      estado: "Estable",
      proximaRevision: "En 30 mins",
    },
    {
      id: "2",
      paciente: "Luna",
      tipoMascota: "Gato (Siamés)",
      propietario: "Ana Gómez",
      motivoIngreso: "Insuficiencia renal aguda",
      fechaIngreso: "Hace 2 días",
      cama: "Cama 03 - General",
      estado: "En observación",
      proximaRevision: "En 1 hora",
    },
  ]);

  const handleDarDeAlta = (id: string) => {
    setPacientesHospitalizados((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        {/* Cabecera con botón de retorno al Hub */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/pacientes")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Hub de Pacientes
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <BedDouble className="w-6 h-6" />
              </div>
              Área de Hospitalización y Monitoreo
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Control activo de pacientes internados, tratamientos y signos
              vitales.
            </p>
          </div>

          <button
            onClick={() => alert("Función para registrar ingreso directo")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Ingresar Paciente
          </button>
        </div>

        {/* Tarjetas de Resumen Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Pacientes Internados
              </p>
              <h3 className="text-xl font-bold text-white">
                {pacientesHospitalizados.length}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Revisiones Pendientes
              </p>
              <h3 className="text-xl font-bold text-white">2</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Camas Disponibles
              </p>
              <h3 className="text-xl font-bold text-white">7 / 10</h3>
            </div>
          </div>
        </div>

        {/* Listado de Pacientes Hospitalizados */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40">
            <h2 className="text-base font-bold text-white">
              Pacientes en Cuidado Activo
            </h2>
          </div>

          {pacientesHospitalizados.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No hay pacientes hospitalizados en este momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pacientesHospitalizados.map((paciente) => (
                <div
                  key={paciente.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {paciente.paciente}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-900/50 font-medium">
                        {paciente.cama}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/50 font-medium">
                        {paciente.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Propietario:{" "}
                      <span className="text-slate-200">
                        {paciente.propietario}
                      </span>{" "}
                      ({paciente.tipoMascota})
                    </p>
                    <p className="text-sm text-slate-300 pt-1 font-medium italic">
                      Motivo: "{paciente.motivoIngreso}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <button
                      onClick={() =>
                        alert(
                          `Abriendo historial de evolución para ${paciente.paciente}`,
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Registrar Evolución
                    </button>
                    <button
                      onClick={() => handleDarDeAlta(paciente.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Dar de Alta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HospitalizationView;
