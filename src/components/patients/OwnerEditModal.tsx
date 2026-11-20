import { useState } from "react";
import type { FormEvent } from "react";
import { Building2, Mail, Phone, Save, UserRound, X } from "lucide-react";
import { usePatients } from "../../hooks/usePatients";
import type { Owner } from "../../types/patient";
import { getSucursalName } from "../../constants/appConstants";
import { sucursalesDelOwner } from "../../utils/clientMatching";
import { normalizePhone } from "../../utils/phone";

interface OwnerEditModalProps {
  owner: Owner;
  onClose: () => void;
  onSaved?: (owner: Owner) => void;
}

const fieldClass =
  "w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60 transition-colors";
const labelClass = "text-xs font-semibold text-slate-400";

/**
 * Edición de los datos de contacto de un cliente desde el directorio de
 * propietarios. Se actualiza el MISMO dueño (no se crea uno nuevo), por lo que
 * las citas, el historial y las recetas siguen apuntando a este cliente.
 */
export const OwnerEditModal = ({
  owner,
  onClose,
  onSaved,
}: OwnerEditModalProps) => {
  const { getOwnerByPhone, updateOwner } = usePatients();
  const [name, setName] = useState(owner.name);
  const [phone, setPhone] = useState(owner.phone);
  const [email, setEmail] = useState(owner.email ?? "");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nombre = name.trim();
    // Se guarda normalizado para que el teléfono sea comparable y sirva para
    // desempatar clientes con el mismo nombre en el formulario de citas.
    const telefono = normalizePhone(phone);
    const correo = email.trim();

    if (!nombre) {
      setError("Ingresa el nombre del propietario.");
      return;
    }
    if (!telefono) {
      setError("Ingresa un teléfono válido.");
      return;
    }

    const duplicado = getOwnerByPhone(telefono);
    if (duplicado && duplicado.id !== owner.id) {
      setError("Ese teléfono ya está registrado por otro cliente.");
      return;
    }

    const actualizado: Owner = {
      ...owner,
      name: nombre,
      phone: telefono,
      email: correo || undefined,
    };
    updateOwner(owner.id, {
      name: nombre,
      phone: telefono,
      email: correo || undefined,
    });
    onSaved?.(actualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 p-2.5 text-[#ece883]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Editar propietario
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Actualiza los datos de contacto del cliente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block space-y-1.5">
            <span className={labelClass}>Nombre</span>
            <div className="relative">
              <UserRound className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Nombre y apellido"
                className={fieldClass}
                autoFocus
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Teléfono</span>
            <div className="relative">
              <Phone className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500" />
              <input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError("");
                }}
                placeholder="+56 9 1234 5678"
                className={fieldClass}
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>Correo electrónico (opcional)</span>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="correo@ejemplo.cl"
                className={fieldClass}
              />
            </div>
          </label>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            <p>
              El nombre se usa para reconocer al cliente en nuevas citas. Sus
              citas e historial clínico siguen asociados a este mismo
              propietario.
            </p>
            <p className="mt-2 flex items-start gap-2 text-[#ece883]">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Sucursales: {sucursalesDelOwner(owner).map(getSucursalName).join(", ")}
              </span>
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-[#e4df68]"
            >
              <Save className="h-4 w-4" />
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
