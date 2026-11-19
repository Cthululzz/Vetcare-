import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { toPublicUser, useUsers } from "./useUsers";
import type { User } from "../types/user";
import {
  disableDevBypassForSession,
  isBypassAuthEnabled,
} from "../utils/authBypass";

export type { User } from "../types/user";

// ============================================
// TIPOS
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ============================================
// HOOK PRINCIPAL
// ============================================

const AUTH_KEY = "vet_auth_state";

export function useAuth() {
  const [authState, setAuthState] = useLocalStorage<AuthState>(AUTH_KEY, {
    user: null,
    isAuthenticated: false,
  });
  const { storedUsers, findByCredentials } = useUsers();
  const navigate = useNavigate();

  // La sesión guarda solo el ID del usuario efectivo. Si el rol, el correo o el
  // estado cambian en la gestión de usuarios, la interfaz lo refleja de inmediato
  // y un usuario eliminado o desactivado pierde el acceso sin relogin.
  const usuarioActual = useMemo<User | null>(() => {
    if (!authState.isAuthenticated || !authState.user?.id) return null;
    const guardado = storedUsers.find(
      (item) => item.id === authState.user?.id,
    );
    if (!guardado || guardado.isActive === false) return null;
    return toPublicUser(guardado);
  }, [authState.isAuthenticated, authState.user?.id, storedUsers]);
  const autenticado = Boolean(usuarioActual);

  /**
   * Inicia sesión con email y contraseña
   * @returns Objeto con `success` y `error` si falla
   */
  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const foundUser = findByCredentials(email, password);

      if (!foundUser) {
        return {
          success: false,
          error: "Credenciales incorrectas. Verifica tu correo y contraseña.",
        };
      }

      setAuthState({
        user: foundUser,
        isAuthenticated: true,
      });

      return { success: true };
    },
    [findByCredentials, setAuthState],
  );

  /**
   * Ingreso directo usado por el asistente de instalación tras crear el
   * primer administrador. No vuelve a pedir la contraseña recién creada.
   */
  const signIn = useCallback(
    (user: User): void => {
      setAuthState({ user, isAuthenticated: true });
    },
    [setAuthState],
  );

  /** Cierra la sesión y redirige al login */
  const logout = useCallback(() => {
    // En desarrollo el auto-login reaparecería en el siguiente render.
    if (isBypassAuthEnabled()) disableDevBypassForSession();
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    navigate("/login", { replace: true });
  }, [setAuthState, navigate]);

  /** Verifica si el usuario tiene un rol específico */
  const hasRole = useCallback(
    (role: User["role"]): boolean => {
      return usuarioActual?.role === role;
    },
    [usuarioActual],
  );

  /** Verifica si el usuario tiene alguno de los roles especificados */
  const hasAnyRole = useCallback(
    (roles: User["role"][]): boolean => {
      return !!usuarioActual && roles.includes(usuarioActual.role);
    },
    [usuarioActual],
  );

  /**
   * Auto-login para desarrollo. Solo funciona si VITE_BYPASS_AUTH está activo.
   * Loguea automáticamente con las credenciales de VITE_DEFAULT_USER_EMAIL.
   */
  const devAutoLogin = useCallback((): boolean => {
    const bypassAuth = isBypassAuthEnabled();
    const defaultEmail =
      import.meta.env.VITE_DEFAULT_USER_EMAIL || "admin@vetcare.com";

    if (!bypassAuth) return false;
    if (autenticado) return true;

    const defaultUser = storedUsers.find(
      (user) =>
        user.email.toLowerCase() === defaultEmail.toLowerCase() &&
        user.isActive !== false,
    );

    if (defaultUser) {
      setAuthState({
        user: toPublicUser(defaultUser),
        isAuthenticated: true,
      });
      return true;
    }

    return false;
  }, [autenticado, storedUsers, setAuthState]);

  return {
    // Estado
    user: usuarioActual,
    isAuthenticated: autenticado,

    // Acciones
    login,
    signIn,
    logout,

    // Consultas
    hasRole,
    hasAnyRole,

    // Desarrollo
    devAutoLogin,
  };
}
