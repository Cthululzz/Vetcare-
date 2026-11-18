import { useState } from "react";
import {
  Building2,
  CalendarCog,
  ClipboardList,
  CreditCard,
  KeyRound,
  Settings,
} from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { UserManagement } from "../components/users/UserManagement";
import { useLicense } from "../hooks/useLicense";
import { formatDateShort, getLocalTodayStr } from "../utils/dateUtils";

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
    title: "Servicios y precios",
    description:
      "Catálogo de atenciones, vacunas y procedimientos con sus valores.",
    icon: ClipboardList,
  },
];

const Configuration = () => {
  const {
    license,
    diasRestantes,
    suscripcionVigente,
    setTrialStart,
    registerManualPayment,
  } = useLicense();
  const [fechaInicio, setFechaInicio] = useState(
    license?.trialStart ?? getLocalTodayStr(),
  );
  const [mesesPago, setMesesPago] = useState(1);
  const [feedback, setFeedback] = useState("");

  const handleActualizarInicio = () => {
    setTrialStart(fechaInicio);
    setFeedback("Fecha de inicio de la prueba actualizada.");
  };

  const handleRegistrarPago = () => {
    registerManualPayment(mesesPago);
    setFeedback(`Pago manual registrado por ${mesesPago} mes(es).`);
  };

  return (
    <PageShell>
      <PageBanner
        icon={Settings}
        title="Configuración"
        description="Ajustes generales de la clínica. Esta sección se irá habilitando por etapas."
      />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#ece883]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
            Licencia y suscripción
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Organización</p>
            <p className="mt-1 font-semibold text-white">
              {license?.organizationId ?? "Sin activar"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Código de instalación</p>
            <p className="mt-1 font-semibold tracking-wider text-white">
              {license?.activationCode ?? "—"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Estado</p>
            <p className="mt-1 font-semibold text-white">
              {suscripcionVigente
                ? "Suscripción al día"
                : diasRestantes > 0
                  ? `Prueba · ${diasRestantes} día(s) restantes`
                  : "Prueba finalizada · modo lectura"}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Próximo vencimiento</p>
            <p className="mt-1 font-semibold text-white">
              {license?.paidUntil
                ? formatDateShort(license.paidUntil)
                : "Pendiente de pago"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
          <div className="space-y-2">
            <label
              htmlFor="trial-start"
              className="block text-xs font-semibold text-slate-400"
            >
              Fecha de inicio de la prueba
            </label>
            <div className="flex gap-2">
              <input
                id="trial-start"
                type="date"
                value={fechaInicio}
                onChange={(event) => setFechaInicio(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              />
              <button
                type="button"
                onClick={handleActualizarInicio}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-[#ece883]/50 cursor-pointer"
              >
                Actualizar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="payment-months"
              className="block text-xs font-semibold text-slate-400"
            >
              Registrar pago manual
            </label>
            <div className="flex gap-2">
              <input
                id="payment-months"
                type="number"
                min={1}
                value={mesesPago}
                onChange={(event) => setMesesPago(Number(event.target.value))}
                className="w-20 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              />
              <button
                type="button"
                onClick={handleRegistrarPago}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ece883] px-3 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                Registrar pago
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <p className="text-xs text-emerald-300">{feedback}</p>
        )}
      </div>

      <UserManagement />

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
    </PageShell>
  );
};

export default Configuration;
