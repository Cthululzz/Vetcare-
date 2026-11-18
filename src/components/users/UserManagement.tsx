import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  Pencil,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import {
  ROLES_USUARIO,
  SUCURSALES,
  getSucursalName,
  type SucursalId,
  type UserRole,
} from "../../constants/appConstants";
import { useAuth } from "../../hooks/useAuth";
import { useLicense } from "../../hooks/useLicense";
import { useUsers } from "../../hooks/useUsers";
import type { User } from "../../types/user";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  id: string | null;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sucursalId: SucursalId;
  isActive: boolean;
}

const formularioVacio = (): FormState => ({
  id: null,
  name: "",
  email: "",
  password: "",
  role: "VET",
  sucursalId: "centro",
  isActive: true,
});

export const UserManagement = () => {
  const { users, createUser, updateUser, removeUser, emailExists } = useUsers();
  const { user: currentUser } = useAuth();
  const { isReadOnly } = useLicense();

  const [form, setForm] = useState<FormState>(formularioVacio);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rolesGestionables = (Object.keys(ROLES_USUARIO) as UserRole[]).filter(
    (role) => role !== "PROVEEDOR",
  );
  const usuariosVisibles = users.filter((user) => user.role !== "PROVEEDOR");
  const adminsActivos = usuariosVisibles.filter(
    (user) => user.role === "ADMIN" && user.isActive,
  );
  const esUltimoAdmin = (user: User): boolean =>
    user.role === "ADMIN" && adminsActivos.length <= 1;

  const actualizarCampo = <K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setError("");
    setFeedback("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isReadOnly) {
      setError(
        "La aplicación está en modo lectura. Regulariza la suscripción para crear o modificar usuarios.",
      );
      return;
    }
    setError("");
    setFeedback("");

    const nombre = form.name.trim();
    const correo = form.email.trim().toLowerCase();

    if (!nombre) {
      setError("Ingresa el nombre del usuario.");
      return;
    }
    if (!EMAIL_VALIDO.test(correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (emailExists(correo, form.id ?? undefined)) {
      setError("Ya existe un usuario con ese correo electrónico.");
      return;
    }
    if (!form.id && form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (form.id && form.password && form.password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (form.id) {
      const anterior = users.find((user) => user.id === form.id);
      if (!anterior) {
        setError("No se encontró el usuario que quieres actualizar.");
        return;
      }
      if (
        esUltimoAdmin(anterior) &&
        (form.role !== "ADMIN" || !form.isActive)
      ) {
        setError("Debe quedar al menos un administrador activo.");
        return;
      }

      updateUser(form.id, {
        name: nombre,
        email: correo,
        role: form.role,
        sucursalId: form.sucursalId,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      });
      setFeedback("Usuario actualizado correctamente.");
    } else {
      createUser({
        name: nombre,
        email: correo,
        password: form.password,
        role: form.role,
        sucursalId: form.sucursalId,
      });
      setFeedback("Usuario creado correctamente.");
    }

    setForm(formularioVacio());
  };

  const handleEditar = (user: User) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      sucursalId: user.sucursalId,
      isActive: user.isActive,
    });
    setDeleteId(null);
    setError("");
    setFeedback("");
  };

  const handleCancelar = () => {
    setForm(formularioVacio());
    setError("");
    setFeedback("");
  };

  const handleAlternarEstado = (user: User) => {
    if (isReadOnly) return;
    setError("");
    setFeedback("");
    if (user.id === currentUser?.id) {
      setError("No puedes desactivar tu propio usuario.");
      return;
    }
    if (esUltimoAdmin(user) && user.isActive) {
      setError("Debe quedar al menos un administrador activo.");
      return;
    }
    updateUser(user.id, { isActive: !user.isActive });
    setFeedback(
      user.isActive ? "Usuario desactivado." : "Usuario reactivado.",
    );
  };

  const handleEliminar = (user: User) => {
    if (isReadOnly) return;
    setError("");
    setFeedback("");
    if (user.id === currentUser?.id) {
      setError("No puedes eliminar tu propio usuario.");
      return;
    }
    if (esUltimoAdmin(user)) {
      setError("No puedes eliminar al último administrador activo.");
      return;
    }
    if (deleteId !== user.id) {
      setDeleteId(user.id);
      return;
    }
    removeUser(user.id);
    if (form.id === user.id) setForm(formularioVacio());
    setDeleteId(null);
    setFeedback("Usuario eliminado.");
  };

  if (currentUser?.role === "PROVEEDOR") return null;

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-2 border-b border-slate-800 pb-3">
        <ShieldCheck className="h-4 w-4 mt-0.5 text-[#ece883] shrink-0" />
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
            Usuarios y permisos
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Los permisos se derivan del rol asignado. ADMIN tiene acceso
            completo; los demás roles usan la matriz de permisos de la clínica.
          </p>
        </div>
      </div>

      {isReadOnly && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          La aplicación está en modo lectura. No se pueden crear ni modificar
          usuarios hasta regularizar la suscripción.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="user-nombre"
              className="block text-xs font-semibold text-slate-400"
            >
              Nombre
            </label>
            <input
              id="user-nombre"
              disabled={isReadOnly}
              value={form.name}
              onChange={(event) => actualizarCampo("name", event.target.value)}
              placeholder="Nombre y apellido"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-correo"
              className="block text-xs font-semibold text-slate-400"
            >
              Correo electrónico
            </label>
            <input
              id="user-correo"
              disabled={isReadOnly}
              type="email"
              value={form.email}
              onChange={(event) => actualizarCampo("email", event.target.value)}
              placeholder="usuario@clinica.cl"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-password"
              className="block text-xs font-semibold text-slate-400"
            >
              {form.id ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              id="user-password"
              disabled={isReadOnly}
              type="password"
              value={form.password}
              onChange={(event) =>
                actualizarCampo("password", event.target.value)
              }
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="user-rol"
                className="block text-xs font-semibold text-slate-400"
              >
                Rol
              </label>
              <select
                id="user-rol"
                disabled={isReadOnly}
                value={form.role}
                onChange={(event) =>
                  actualizarCampo("role", event.target.value as UserRole)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              >
                {rolesGestionables.map((role) => (
                  <option key={role} value={role}>
                    {ROLES_USUARIO[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="user-sucursal"
                className="block text-xs font-semibold text-slate-400"
              >
                Sucursal
              </label>
              <select
                id="user-sucursal"
                disabled={isReadOnly}
                value={form.sucursalId}
                onChange={(event) =>
                  actualizarCampo(
                    "sucursalId",
                    event.target.value as SucursalId,
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-[#ece883]"
              >
                {SUCURSALES.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={form.isActive}
              onChange={(event) =>
                actualizarCampo("isActive", event.target.checked)
              }
              className="h-4 w-4 accent-[#ece883]"
            />
            Usuario activo
          </label>

          <div className="flex gap-2">
            {form.id && (
              <button
                type="button"
                disabled={isReadOnly}
                onClick={handleCancelar}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isReadOnly}
              className="inline-flex items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer disabled:opacity-50"
            >
              {form.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <UserRoundPlus className="h-4 w-4" />
              )}
              {form.id ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Sucursal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {usuariosVisibles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Todavía no hay usuarios cargados.
                </td>
              </tr>
            )}
            {usuariosVisibles.map((user) => (
              <tr key={user.id} className="text-slate-300">
                <td className="px-4 py-3 font-semibold text-white">
                  {user.name}
                </td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{ROLES_USUARIO[user.role]}</td>
                <td className="px-4 py-3">{getSucursalName(user.sucursalId)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.isActive
                        ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300"
                        : "rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-400"
                    }
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      title="Editar usuario"
                      disabled={isReadOnly}
                      onClick={() => handleEditar(user)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-[#ece883]/50 hover:text-[#ece883] cursor-pointer disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={user.isActive ? "Desactivar usuario" : "Reactivar usuario"}
                      disabled={isReadOnly}
                      onClick={() => handleAlternarEstado(user)}
                      className="rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-[#ece883]/50 hover:text-[#ece883] cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={
                        deleteId === user.id
                          ? "Confirmar eliminación"
                          : "Eliminar usuario"
                      }
                      disabled={isReadOnly}
                      onClick={() => handleEliminar(user)}
                      className={
                        deleteId === user.id
                          ? "rounded-lg border border-red-500/50 bg-red-500/10 p-2 text-red-300 cursor-pointer"
                          : "rounded-lg border border-slate-700 p-2 text-slate-300 transition-colors hover:border-red-500/50 hover:text-red-300 cursor-pointer"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
