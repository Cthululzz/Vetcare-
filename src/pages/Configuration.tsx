import {
  Building2,
  CalendarCog,
  ClipboardList,
  Settings,
  Stethoscope,
} from "lucide-react";
import { Footer } from "../components/common/Footer";

interface PendingSection {
  title: string;
  description: string;
  icon: typeof Settings;
}

// Secciones que se habilitarán más adelante. La página existe desde ahora
// para que el acceso del menú no quede sin destino.
const PENDING_SECTIONS: PendingSection[] = [
  {
    title: "Datos de la clínica",
    description:
      "Nombre, dirección, teléfono y datos que aparecen en recetas e informes.",
    icon: Building2,
  },
  {
    title: "Sucursales",
    description:
      "Configuración de sucursales, horarios de atención y sucursal activa.",
    icon: CalendarCog,
  },
  {
    title: "Equipo veterinario",
    description: "Profesionales, especialidades y disponibilidad para agenda.",
    icon: Stethoscope,
  },
  {
    title: "Servicios y precios",
    description:
      "Catálogo de atenciones, vacunas y procedimientos con sus valores.",
    icon: ClipboardList,
  },
];

const Configuration = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-[#ece883]" />
              Configuración
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Ajustes generales de la clínica. Esta sección se irá habilitando
              por etapas.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Próximamente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PENDING_SECTIONS.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4"
              >
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 italic pt-1">
            Por ahora estos valores vienen predefinidos en la aplicación.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Configuration;
