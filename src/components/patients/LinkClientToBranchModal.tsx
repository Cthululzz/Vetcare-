import { useState } from "react";
import { AlertTriangle, Building2, Check, X } from "lucide-react";
import {
  getEspecieLabel,
  getSucursalName,
  type SucursalId,
} from "../../constants/appConstants";
import {
  sucursalesDelOwner,
  type ClientMatch,
} from "../../utils/clientMatching";

interface LinkClientToBranchModalProps {
  coincidencias: ClientMatch[];
  sucursalDestino: SucursalId;
  puedeVincular: boolean;
  onVincular: (ownerId: string, mascotaId?: string) => void;
  onCancel: () => void;
}

/**
 * Aviso que aparece mientras se llenan los datos de un alta o de una cita y se
 * detecta que ese cliente (o esa mascota) ya existe en otra sucursal.
 * Nunca crea un duplicado: sólo ofrece agregar la sucursal a la ficha existente.
 */
export const LinkClientToBranchModal = ({
  coincidencias,
  sucursalDestino,
  puedeVincular,
  onVincular,
  onCancel,
}: LinkClientToBranchModalProps) => {
  const [seleccion, setSeleccion] = useState(0);

  if (coincidencias.length === 0) return null;

  const indice = Math.min(seleccion, coincidencias.length - 1);
  const match = coincidencias[indice];
  const ownerMatch: typeof match.owner = match.owner;
  const sucursales = sucursalesDelOwner(ownerMatch);
  const destino = getSucursalName(sucursalDestino);
  const hayDudas = coincidencias.length > 1 || match.confianza !== "alta";
  const mascota = match.mascotaCoincidente;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 p-2.5 text-[#ece883]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Este cliente ya está registrado
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                Revisa los datos antes de continuar. No se creará un duplicado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar aviso"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {hayDudas && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Coincidencia con datos parecidos
              </div>
              <p className="mt-1">
                El teléfono o el correo coinciden, pero no podemos asegurar que
                sea la misma persona. Elige la ficha correcta.
              </p>
            </div>
          )}

          {coincidencias.length > 1 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Clientes encontrados
              </p>
              {coincidencias.map((opcion, i) => (
                <button
                  key={opcion.owner.id}
                  type="button"
                  onClick={() => setSeleccion(i)}
                  className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm transition-colors cursor-pointer ${
                    i === indice
                      ? "border-[#ece883]/60 bg-[#ece883]/10 text-[#ece883]"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${i === indice ? "opacity-100" : "opacity-0"}`}
                  />
                  <span>
                    <span className="block font-semibold">{opcion.owner.name}</span>
                    <span className="block text-xs opacity-80">
                      {opcion.owner.phone}
                      {opcion.owner.email ? ` · ${opcion.owner.email}` : ""}
                    </span>
                    <span className="block text-xs opacity-70">
                      Sucursales: {sucursalesDelOwner(opcion.owner).map(getSucursalName).join(", ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-white">
                {ownerMatch.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {ownerMatch.phone}
                {ownerMatch.email ? ` · ${ownerMatch.email}` : ""}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-[#ece883]" />
                Se atiende en: {sucursales.map(getSucursalName).join(", ")}
              </p>
            </div>
          )}

          {mascota && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mascota encontrada
              </p>
              <p className="mt-1 font-semibold text-white">
                {mascota.name}
                {mascota.breed ? ` (${mascota.breed})` : ""}
              </p>
              <p className="text-xs text-slate-400">
                {getEspecieLabel(mascota.species)}
              </p>
            </div>
          )}

          <p className="text-sm leading-relaxed text-slate-300">
            {match.mascotaExacta ? (
              <>
                <span className="font-semibold text-white">
                  {ownerMatch.name} y {mascota?.name}
                </span>{" "}
                ya están registrados. ¿Agregar <strong>{destino}</strong> a esta
                ficha? Su historial quedará disponible de inmediato.
              </>
            ) : (
              <>
                <span className="font-semibold text-white">
                  {ownerMatch.name}
                </span>{" "}
                ya está registrado. ¿Agregar <strong>{destino}</strong> para{" "}
                {mascota ? "usar su ficha" : "registrar la nueva mascota bajo el mismo dueño"}?
              </>
            )}
          </p>

          {!puedeVincular && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Tu rol no permite modificar fichas. Solicita a un administrador
              que realice la vinculación.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-800 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700 cursor-pointer"
          >
            No, revisar datos
          </button>
          <button
            type="button"
            disabled={!puedeVincular}
            onClick={() => onVincular(ownerMatch.id, mascota?.id)}
            className="rounded-xl bg-[#ece883] px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Agregar {destino}
          </button>
        </div>
      </div>
    </div>
  );
};
