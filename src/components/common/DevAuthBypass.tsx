import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  isBypassAuthEnabled,
  isDevBypassConfigured,
  restoreDevBypass,
} from "../../utils/authBypass";

/**
 * Componente que ejecuta el auto-login en modo desarrollo.
 * Solo funciona si VITE_BYPASS_AUTH=true está configurado.
 * Si el usuario cerró sesión, muestra un control para volver a activarlo.
 */
export function DevAuthBypass() {
  const { devAutoLogin } = useAuth();

  useEffect(() => {
    devAutoLogin();
  }, [devAutoLogin]);

  const mostrarReactivacion =
    isDevBypassConfigured() && !isBypassAuthEnabled();

  if (!mostrarReactivacion) return null;

  return (
    <button
      type="button"
      onClick={() => {
        restoreDevBypass();
        window.location.reload();
      }}
      className="fixed bottom-4 left-4 z-[100] inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-slate-900/95 px-3 py-2 text-xs font-semibold text-violet-200 shadow-xl transition-colors hover:bg-violet-500/15"
      title="Volver a iniciar sesión automáticamente con el usuario de desarrollo"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reactivar auto-login (dev)
    </button>
  );
}
