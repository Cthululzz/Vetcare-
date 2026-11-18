import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";
import { toPublicUser, useUsers } from "./useUsers";
import type { User } from "../types/user";

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
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    navigate("/login", { replace: true });
  }, [setAuthState, navigate]);

  /** Verifica si el usuario tiene un rol específico */
  const hasRole = useCallback(
    (role: User["role"]): boolean => {
      return authState.user?.role === role;
    },
    [authState.user],
  );

  /** Verifica si el usuario tiene alguno de los roles especificados */
  const hasAnyRole = useCallback(
    (roles: User["role"][]): boolean => {
      return !!authState.user && roles.includes(authState.user.role);
    },
    [authState.user],
  );

  /**
   * Auto-login para desarrollo. Solo funciona si VITE_BYPASS_AUTH está activo.
   * Loguea automáticamente con las credenciales de VITE_DEFAULT_USER_EMAIL.
   */
  const devAutoLogin = useCallback((): boolean => {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
    const defaultEmail =
      import.meta.env.VITE_DEFAULT_USER_EMAIL || "admin@vetcare.com";

    if (!bypassAuth) return false;
    if (authState.isAuthenticated) return true;

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
  }, [authState.isAuthenticated, storedUsers, setAuthState]);

  return {
    // Estado
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,

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
