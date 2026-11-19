import { useState, type FormEvent } from "react";
import { AlertCircle, ShieldCheck, UserRoundPlus } from "lucide-react";
import { SUCURSALES, type SucursalId } from "../../constants/appConstants";
import {
  PROVIDER_EMAIL,
  PROVIDER_NAME,
  PROVIDER_PASSWORD,
  PROVIDER_SUCURSAL_ID,
} from "../../constants/provider";
import { useAuth } from "../../hooks/useAuth";
import { useLicense } from "../../hooks/useLicense";
import { useProviderClinics } from "../../hooks/useProviderClinics";
import { useUsers } from "../../hooks/useUsers";
import {
  GRACE_DAYS,
  PILOT_ACTIVATION_CODE,
  PILOT_ORGANIZATION_ID,
  TRIAL_DAYS,
} from "../../constants/license";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const SetupScreen = () => {
  const { createUser } = useUsers();
  const { signIn } = useAuth();
  const { license } = useLicense();
  const { clinics, registerClinic } = useProviderClinics();

  const [nombreClinica, setNombreClinica] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [sucursalId, setSucursalId] = useState<SucursalId>("centro");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!nombre.trim()) {
      setError("Ingresa el nombre del administrador.");
      return;
    }
    if (!EMAIL_VALIDO.test(correo.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const organizationId =
      license?.organizationId ?? PILOT_ORGANIZATION_ID;
    if (clinics.some((clinic) => clinic.organizationId === organizationId)) {
      setError(
        "Esta veterinaria base ya está registrada en la consola del proveedor.",
      );
      return;
    }

    const admin = createUser({
      name: nombre.trim(),
      email: correo.trim().toLowerCase(),
      password,
      role: "ADMIN",
      sucursalId,
      organizationId,
    });

    // La cuenta del proveedor se crea junto con la instalación, pero no se
    // muestra en la gestión de usuarios de la clínica.
    createUser({
      name: PROVIDER_NAME,
      email: PROVIDER_EMAIL,
      password: PROVIDER_PASSWORD,
      role: "PROVEEDOR",
      sucursalId: PROVIDER_SUCURSAL_ID,
    });

    // La veterinaria base queda en el registro que consulta el proveedor.
    const clinica = registerClinic({
      name: nombreClinica.trim() || `${nombre.trim()} · Veterinaria base`,
      organizationId,
      adminName: nombre.trim(),
      adminEmail: correo.trim().toLowerCase(),
      activationCode: license?.activationCode ?? PILOT_ACTIVATION_CODE,
      trialStart: license?.trialStart ?? "",
    });
    if (!clinica) {
      setError("No se pudo registrar la veterinaria base. Inténtalo nuevamente.");
      return;
    }

    signIn(admin);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 p-3 text-[#ece883]">
            <UserRoundPlus className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Configuración inicial
            </h1>
            <p className="text-sm text-slate-400">
              Crea el primer administrador de esta clínica.
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-[#ece883]/20 bg-[#ece883]/5 px-4 py-3 text-xs text-[#ece883]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            La prueba de {TRIAL_DAYS} días ya está activa, seguida de {GRACE_DAYS}{" "}
            días de gracia en modo lectura. Después de crear el administrador
            podrás ingresar el resto del equipo desde Configuración.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="setup-clinica"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Nombre de la veterinaria base
            </label>
            <input
              id="setup-clinica"
              value={nombreClinica}
              onChange={(event) => {
                setNombreClinica(event.target.value);
                setError("");
              }}
              placeholder="Ej. Clínica Veterinaria Central"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="setup-nombre"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Nombre del administrador
            </label>
            <input
              id="setup-nombre"
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                setError("");
              }}
              placeholder="Nombre y apellido"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="setup-correo"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Correo electrónico
            </label>
            <input
              id="setup-correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(event) => {
                setCorreo(event.target.value);
                setError("");
              }}
              placeholder="admin@clinica.cl"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="setup-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Contraseña
              </label>
              <input
                id="setup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="setup-confirmacion"
                className="block text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                Confirmar contraseña
              </label>
              <input
                id="setup-confirmacion"
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                onChange={(event) => {
                  setConfirmacion(event.target.value);
                  setError("");
                }}
                placeholder="Repite la contraseña"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="setup-sucursal"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Sucursal principal
            </label>
            <select
              id="setup-sucursal"
              value={sucursalId}
              onChange={(event) =>
                setSucursalId(event.target.value as SucursalId)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#ece883]"
            >
              {SUCURSALES.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ece883] px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Crear administrador e ingresar
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          En esta etapa las credenciales quedan guardadas solo en este equipo.
        </p>
      </div>
    </div>
  );
};
