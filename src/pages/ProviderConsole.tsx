import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clipboard,
  Clock,
  CreditCard,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { PILOT_ACTIVATION_CODE } from "../constants/license";
import { usePermissions } from "../hooks/usePermissions";
import {
  describeClinic,
  useProviderClinics,
  type ExtensionResult,
} from "../hooks/useProviderClinics";
import { formatDateShort, getLocalTodayStr } from "../utils/dateUtils";
import { PERMISSIONS } from "../utils/permissions";

interface NewClinicForm {
  name: string;
  organizationId: string;
  adminName: string;
  adminEmail: string;
  trialStart: string;
}

const formularioVacio = (): NewClinicForm => ({
  name: "",
  organizationId: "",
  adminName: "",
  adminEmail: "",
  trialStart: getLocalTodayStr(),
});

const estadoStyles: Record<
  "al_dia" | "prueba" | "gracia" | "bloqueado",
  { label: string; className: string }
> = {
  al_dia: {
    label: "Suscripción al día",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  prueba: {
    label: "En prueba",
    className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  },
  gracia: {
    label: "Gracia · modo lectura",
    className: "border-orange-400/40 bg-orange-400/10 text-orange-200",
  },
  bloqueado: {
    label: "Bloqueado",
    className: "border-red-500/40 bg-red-500/10 text-red-300",
  },
};

const ProviderConsole = () => {
  const { can } = usePermissions();
  const {
    clinics,
    registerClinic,
    updateTrialStart,
    removeClinic,
    extendClinic,
  } = useProviderClinics();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mesesExtension, setMesesExtension] = useState(1);
  const [generated, setGenerated] = useState<ExtensionResult | null>(null);
  const [nueva, setNueva] = useState<NewClinicForm>(formularioVacio);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  if (!can(PERMISSIONS.LICENSE_MANAGE)) return null;

  const seleccionada =
    clinics.find((clinic) => clinic.organizationId === selectedId) ??
    clinics[0] ??
    null;

  const vistas = clinics.map((clinic) => describeClinic(clinic));

  const handleRegistrar = () => {
    setError("");
    setFeedback("");
    if (!nueva.name.trim()) {
      setError("Ingresa el nombre de la veterinaria base.");
      return;
    }
    if (!nueva.adminEmail.trim()) {
      setError("Ingresa el correo del administrador.");
      return;
    }

    const creada = registerClinic({
      ...nueva,
      activationCode: PILOT_ACTIVATION_CODE,
    });
    if (!creada) {
      setError("Ya existe una veterinaria base con ese identificador.");
      return;
    }

    setSelectedId(creada.organizationId);
    setGenerated(null);
    setNueva(formularioVacio());
    setMostrarAlta(false);
    setFeedback("Veterinaria base registrada en la consola.");
  };

  const handleExtender = () => {
    setError("");
    setFeedback("");
    if (!seleccionada) {
      setError("Selecciona una veterinaria base.");
      return;
    }

    const resultado = extendClinic(seleccionada.organizationId, mesesExtension);
    if (!resultado) {
      setError("No se pudo generar la actualización.");
      return;
    }
    setGenerated(resultado);
    setFeedback(
      `Extensión registrada. Entrega el código a ${seleccionada.adminName || "el administrador"}.`,
    );
  };

  const handleCopiar = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.code);
      setFeedback("Código copiado al portapapeles.");
      setError("");
    } catch {
      setError("No se pudo copiar. Selecciona y copia el código manualmente.");
    }
  };

  const handleEliminar = (organizationId: string) => {
    removeClinic(organizationId);
    setSelectedId(null);
    setGenerated(null);
    setFeedback("Veterinaria base eliminada del registro del proveedor.");
    setError("");
  };

  return (
    <PageShell>
      <PageBanner
        icon={ShieldCheck}
        title="Consola de proveedor"
        description="Estado de pago de las veterinarias base registradas. Vista global del proveedor, sin detalle de sucursales."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-[#ece883]/25 bg-[#ece883]/5 px-4 py-3 text-xs text-[#ece883]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed">
          En esta etapa offline no existe un servidor que reciba el cambio en la
          clínica. La extensión se decide y se registra aquí, en tu equipo; para
          aplicarla se genera un código ligado a la veterinaria que el
          administrador solo debe pegar en Configuración. La sincronización
          directa llegará con Tauri + SQLite.
        </p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#ece883]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Veterinarias base registradas
            </h2>
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
              {clinics.length}
            </span>
          </div>
          <button
            type="button"
            id="provider-toggle-alta"
            onClick={() => setMostrarAlta((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-[#ece883]/50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {mostrarAlta ? "Ocultar formulario" : "Registrar veterinaria"}
          </button>
        </div>

        {mostrarAlta && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="space-y-1.5">
              <label
                htmlFor="provider-clinic-name"
                className="block text-xs font-semibold text-slate-400"
              >
                Nombre de la veterinaria base
              </label>
              <input
                id="provider-clinic-name"
                value={nueva.name}
                onChange={(event) =>
                  setNueva((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ej. Clínica Veterinaria Central"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="provider-clinic-org"
                className="block text-xs font-semibold text-slate-400"
              >
                Identificador de organización
              </label>
              <input
                id="provider-clinic-org"
                value={nueva.organizationId}
                onChange={(event) =>
                  setNueva((prev) => ({
                    ...prev,
                    organizationId: event.target.value,
                  }))
                }
                placeholder="vet-piloto"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="provider-clinic-admin-name"
                className="block text-xs font-semibold text-slate-400"
              >
                Nombre del administrador
              </label>
              <input
                id="provider-clinic-admin-name"
                value={nueva.adminName}
                onChange={(event) =>
                  setNueva((prev) => ({
                    ...prev,
                    adminName: event.target.value,
                  }))
                }
                placeholder="Nombre y apellido"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="provider-clinic-admin-email"
                className="block text-xs font-semibold text-slate-400"
              >
                Correo del administrador
              </label>
              <input
                id="provider-clinic-admin-email"
                type="email"
                value={nueva.adminEmail}
                onChange={(event) =>
                  setNueva((prev) => ({
                    ...prev,
                    adminEmail: event.target.value,
                  }))
                }
                placeholder="admin@clinica.cl"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="provider-clinic-trial-start"
                className="block text-xs font-semibold text-slate-400"
              >
                Inicio de la prueba
              </label>
              <input
                id="provider-clinic-trial-start"
                type="date"
                value={nueva.trialStart}
                onChange={(event) =>
                  setNueva((prev) => ({
                    ...prev,
                    trialStart: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                id="provider-register-clinic"
                onClick={handleRegistrar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Guardar veterinaria
              </button>
            </div>
          </div>
        )}

        {vistas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
            Todavía no hay veterinarias base registradas. Registra una para ver
            su estado de pago.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 font-bold">Veterinaria base</th>
                  <th className="px-3 py-2 font-bold">Administrador</th>
                  <th className="px-3 py-2 font-bold">Estado de pago</th>
                  <th className="px-3 py-2 font-bold">Inicio prueba</th>
                  <th className="px-3 py-2 font-bold">Próximo vencimiento</th>
                  <th className="px-3 py-2 font-bold">Última actualización</th>
                  <th className="px-3 py-2 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vistas.map((clinic) => {
                  const estilo = estadoStyles[clinic.estadoPago];
                  const activa = seleccionada?.organizationId === clinic.organizationId;
                  return (
                    <tr
                      key={clinic.organizationId}
                      className={`border-b border-slate-800/60 transition-colors ${activa ? "bg-[#ece883]/5" : "hover:bg-slate-800/30"}`}
                    >
                      <td className="px-3 py-3">
                        <p className="font-semibold text-white">{clinic.name}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                          {clinic.organizationId}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="flex items-center gap-1.5 text-slate-200">
                          <UserRound className="h-3.5 w-3.5 text-slate-500" />
                          {clinic.adminName || "Sin nombre"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {clinic.adminEmail || "Sin correo"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${estilo.className}`}
                        >
                          {estilo.label}
                        </span>
                        {clinic.estadoPago === "prueba" && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {clinic.diasRestantes} día(s) de prueba restantes
                          </p>
                        )}
                        {clinic.estadoPago === "gracia" && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <Clock className="h-3 w-3" />
                            {clinic.diasGraciaRestantes} día(s) de gracia
                            restantes
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {formatDateShort(clinic.trialStart)}
                      </td>
                      <td className="px-3 py-3 text-slate-300">
                        {clinic.paidUntil
                          ? formatDateShort(clinic.paidUntil)
                          : "Pendiente de pago"}
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {clinic.lastUpdateCode ? (
                          <span className="font-mono text-[10px] text-[#ece883]">
                            {clinic.lastUpdateCode.slice(-6)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(clinic.organizationId);
                              setGenerated(null);
                              setFeedback("");
                              setError("");
                            }}
                            className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-[#ece883]/50 cursor-pointer"
                          >
                            Seleccionar
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar ${clinic.name}`}
                            onClick={() => handleEliminar(clinic.organizationId)}
                            className="rounded-lg border border-slate-800 p-1.5 text-slate-500 transition-colors hover:border-red-500/40 hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {seleccionada && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Extender suscripción · {seleccionada.name}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Organización {seleccionada.organizationId} · administrador{" "}
              {seleccionada.adminEmail || "sin correo"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-500">Estado actual</p>
              <p className="mt-1 font-semibold text-white">
                {estadoStyles[describeClinic(seleccionada).estadoPago].label}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-500">Vigencia actual</p>
              <p className="mt-1 font-semibold text-white">
                {seleccionada.paidUntil
                  ? formatDateShort(seleccionada.paidUntil)
                  : "Sin pago registrado"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs text-slate-500">Pagos registrados</p>
              <p className="mt-1 font-semibold text-white">
                {seleccionada.payments.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label
                htmlFor="provider-months"
                className="block text-xs font-semibold text-slate-400"
              >
                Meses a extender
              </label>
              <select
                id="provider-months"
                value={mesesExtension}
                onChange={(event) => setMesesExtension(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              >
                {[1, 3, 6, 12].map((meses) => (
                  <option key={meses} value={meses}>
                    {meses} {meses === 1 ? "mes" : "meses"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="provider-trial-start"
                className="block text-xs font-semibold text-slate-400"
              >
                Ajustar inicio de prueba
              </label>
              <input
                id="provider-trial-start"
                type="date"
                value={seleccionada.trialStart}
                onChange={(event) =>
                  updateTrialStart(
                    seleccionada.organizationId,
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              />
            </div>
            <button
              type="button"
              id="provider-extend"
              onClick={handleExtender}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              Generar actualización
            </button>
          </div>

          {generated && (
            <div className="space-y-2 rounded-xl border border-[#ece883]/30 bg-[#ece883]/5 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
                  Código de actualización
                </p>
                <button
                  type="button"
                  id="provider-copy-code"
                  onClick={handleCopiar}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:border-[#ece883]/50 cursor-pointer"
                >
                  <Clipboard className="h-3 w-3" />
                  Copiar
                </button>
              </div>
              <p
                id="provider-update-code"
                className="break-all font-mono text-sm font-bold tracking-wider text-[#ece883]"
              >
                {generated.code}
              </p>
              <p className="text-xs text-slate-400">
                Nueva vigencia: {formatDateShort(generated.paidUntil)} ·{" "}
                {generated.months} {generated.months === 1 ? "mes" : "meses"}.
                Entrégalo al administrador; él solo debe pegarlo en
                Configuración → Aplicar actualización del proveedor.
              </p>
            </div>
          )}

          {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </section>
      )}
    </PageShell>
  );
};

export default ProviderConsole;
