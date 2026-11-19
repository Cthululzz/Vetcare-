import { useState, type FormEvent } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { PageBanner } from "../components/common/PageBanner";
import { PageShell } from "../components/common/PageShell";
import { useAuth } from "../hooks/useAuth";
import { useUsers } from "../hooks/useUsers";
import { ROLES_USUARIO } from "../constants/appConstants";

const MyAccount = () => {
  const { user } = useAuth();
  const { storedUsers, emailExists, updateUser } = useUsers();

  const [nombre, setNombre] = useState(user?.name ?? "");
  const [correo, setCorreo] = useState(user?.email ?? "");
  const [perfilFeedback, setPerfilFeedback] = useState("");
  const [perfilError, setPerfilError] = useState("");

  const [claveActual, setClaveActual] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [claveConfirmacion, setClaveConfirmacion] = useState("");
  const [claveFeedback, setClaveFeedback] = useState("");
  const [claveError, setClaveError] = useState("");

  if (!user) return null;

  const handleGuardarPerfil = (event: FormEvent) => {
    event.preventDefault();
    setPerfilFeedback("");
    setPerfilError("");

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();
    if (!nombreLimpio || !correoLimpio) {
      setPerfilError("Completa el nombre y el correo electrónico.");
      return;
    }
    if (emailExists(correoLimpio, user.id)) {
      setPerfilError("Ese correo ya pertenece a otro usuario.");
      return;
    }

    updateUser(user.id, { name: nombreLimpio, email: correoLimpio });
    setPerfilFeedback("Los datos del perfil se guardaron correctamente.");
  };

  const handleCambiarClave = (event: FormEvent) => {
    event.preventDefault();
    setClaveFeedback("");
    setClaveError("");

    const guardado = storedUsers.find((item) => item.id === user.id);
    if (!guardado || guardado.password !== claveActual) {
      setClaveError("La contraseña actual no es correcta.");
      return;
    }
    if (claveNueva.length < 6) {
      setClaveError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (claveNueva !== claveConfirmacion) {
      setClaveError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    updateUser(user.id, { password: claveNueva });
    setClaveActual("");
    setClaveNueva("");
    setClaveConfirmacion("");
    setClaveFeedback("La contraseña se actualizó correctamente.");
  };

  const inputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30";

  return (
    <PageShell>
      <PageBanner
        icon={UserRound}
        title="Mi cuenta"
        description="Revisa tus datos y actualiza tu contraseña."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserRound className="h-4 w-4 text-[#ece883]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Datos personales
            </h2>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
            <p className="text-xs text-slate-500">Rol asignado</p>
            <p className="mt-1 font-semibold text-white">
              {ROLES_USUARIO[user.role]}
            </p>
          </div>

          <form onSubmit={handleGuardarPerfil} className="space-y-4">
            <div>
              <label
                htmlFor="mi-nombre"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Nombre completo
              </label>
              <input
                id="mi-nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="mi-correo"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Correo electrónico
              </label>
              <input
                id="mi-correo"
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                className={inputClass}
              />
            </div>

            {perfilError && (
              <p className="text-xs text-red-300">{perfilError}</p>
            )}
            {perfilFeedback && (
              <p className="text-xs text-emerald-300">{perfilFeedback}</p>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68]"
            >
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="h-4 w-4 text-[#ece883]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
              Cambiar contraseña
            </h2>
          </div>

          <form onSubmit={handleCambiarClave} className="space-y-4">
            <div>
              <label
                htmlFor="clave-actual"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Contraseña actual
              </label>
              <input
                id="clave-actual"
                type="password"
                value={claveActual}
                onChange={(event) => setClaveActual(event.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label
                htmlFor="clave-nueva"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Nueva contraseña
              </label>
              <input
                id="clave-nueva"
                type="password"
                value={claveNueva}
                onChange={(event) => setClaveNueva(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label
                htmlFor="clave-confirmacion"
                className="mb-1.5 block text-xs font-semibold text-slate-300"
              >
                Confirmar nueva contraseña
              </label>
              <input
                id="clave-confirmacion"
                type="password"
                value={claveConfirmacion}
                onChange={(event) => setClaveConfirmacion(event.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>

            {claveError && <p className="text-xs text-red-300">{claveError}</p>}
            {claveFeedback && (
              <p className="text-xs text-emerald-300">{claveFeedback}</p>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-[#ece883]/30 bg-[#ece883]/10 px-4 py-2.5 text-sm font-bold text-[#ece883] transition-colors hover:bg-[#ece883]/20"
            >
              <KeyRound className="h-4 w-4" />
              Actualizar contraseña
            </button>
          </form>

          <p className="pt-1 text-xs leading-relaxed text-slate-500">
            Esta versión guarda las credenciales en el navegador. La
            autenticación real se incorporará con el backend.
          </p>
        </section>
      </div>
    </PageShell>
  );
};

export default MyAccount;
