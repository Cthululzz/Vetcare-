import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarCog,
  ClipboardList,
  CreditCard,
  KeyRound,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { UserManagement } from "../components/users/UserManagement";
import { useLicense } from "../hooks/useLicense";
import { usePermissions } from "../hooks/usePermissions";
import { formatDateShort } from "../utils/dateUtils";
import { PERMISSIONS } from "../utils/permissions";

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
  const { license, diasRestantes, suscripcionVigente, applyLicenseCode } =
    useLicense();
  const { can } = usePermissions();

  const esProveedor = can(PERMISSIONS.LICENSE_MANAGE);
  const puedeGestionarUsuarios = can(PERMISSIONS.SYSTEM_ADMIN);

  const [codigoPago, setCodigoPago] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const handleAplicarCodigo = () => {
    const resultado = applyLicenseCode(codigoPago);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo aplicar el código.");
      setFeedback("");
      return;
    }
    setFeedback(
      resultado.meses === 0
        ? "La licencia ya estaba al día con esa fecha."
        : `Código aplicado: ${resultado.meses} mes(es) de suscripción.`,
    );
    setCodigoPago("");
    setError("");
  };

  return (
    <PageShell>
      <PageBanner
        icon={Settings}
        title="Configuración"
        description="Ajustes generales de la clínica. Esta sección se irá habilitando por etapas."
      />

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
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

        {esProveedor ? (
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 p-2.5 text-[#ece883]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Gestión desde la consola de proveedor
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Desde tu equipo revisas todas las veterinarias base, su
                  administrador y el estado de pago. La extensión se genera allí
                  y el administrador solo pega el código en la clínica.
                </p>
              </div>
            </div>
            <Link
              id="provider-console-link"
              to="/proveedor"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68]"
            >
              <ShieldCheck className="h-4 w-4" />
              Abrir consola de proveedor
            </Link>
          </div>
        ) : (
          <div className="space-y-2 border-t border-slate-800 pt-4">
            <label
              htmlFor="payment-code"
              className="block text-xs font-semibold text-slate-400"
            >
              Aplicar actualización del proveedor o código de pago
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="payment-code"
                value={codigoPago}
                onChange={(event) => {
                  setCodigoPago(event.target.value);
                  setError("");
                  setFeedback("");
                }}
                placeholder="VETEXT-... o VETPAGO-..."
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-[#ece883]"
              />
              <button
                type="button"
                id="apply-license-code"
                onClick={handleAplicarCodigo}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
              >
                <CreditCard className="h-4 w-4" />
                Aplicar código
              </button>
            </div>
            <p className="text-xs text-slate-500">
              El proveedor genera la actualización desde su equipo y te la
              entrega. El código solo sirve para esta veterinaria base.
            </p>
          </div>
        )}

        {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}
        {error && <p className="text-xs text-red-300">{error}</p>}
      </section>

      {puedeGestionarUsuarios && <UserManagement />}

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
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
      </section>
    </PageShell>
  );
};

export default Configuration;
