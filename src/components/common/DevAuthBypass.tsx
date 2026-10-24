import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";

/**
 * Componente que ejecuta el auto-login en modo desarrollo.
 * Solo funciona si VITE_BYPASS_AUTH=true está configurado.
 * No renderiza nada visible.
 */
export function DevAuthBypass() {
  const { devAutoLogin } = useAuth();

  useEffect(() => {
    devAutoLogin();
  }, [devAutoLogin]);

  return null; // No renderiza nada
}
