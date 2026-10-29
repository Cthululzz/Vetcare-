import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "../constants/appConstants";

// ============================================
// TIPOS
// ============================================
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// ============================================
// USUARIOS DE PRUEBA (mock para localStorage)
// En producción, estos vendrían de un backend
// ============================================
const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: "user-001",
    email: "admin@vetcare.com",
    password: "admin123",
    name: "Dr. Silva",
    role: "ADMIN",
  },
  {
    id: "user-002",
    email: "vet@vetcare.com",
    password: "vet123",
    name: "Dra. Gómez",
    role: "VET",
  },
  {
    id: "user-003",
    email: "recepcion@vetcare.com",
    password: "recep123",
    name: "María Pérez",
    role: "RECEPTIONIST",
  },
];

// ============================================
// HOOK PRINCIPAL
// ============================================
const AUTH_KEY = "vet_auth_state";

export function useAuth() {
  const [authState, setAuthState] = useLocalStorage<AuthState>(AUTH_KEY, {
    user: null,
    isAuthenticated: false,
  });

  const navigate = useNavigate();

  /**
   * Inicia sesión con email y contraseña
   * @returns Objeto con `success` y `error` si falla
   */
  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const normalizedEmail = email.trim().toLowerCase();

      const foundUser = MOCK_USERS.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail && u.password === password,
      );

      if (!foundUser) {
        return {
          success: false,
          error: "Credenciales incorrectas. Verifica tu correo y contraseña.",
        };
      }

      // Separar datos del usuario de la contraseña
      const { password: _, ...userWithoutPassword } = foundUser;

      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true,
      });

      return { success: true };
    },
    [setAuthState],
  );

  /**
   * Cierra la sesión y redirige al login
   */
  const logout = useCallback(() => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    navigate("/login", { replace: true });
  }, [setAuthState, navigate]);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return authState.user?.role === role;
    },
    [authState.user],
  );

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return !!authState.user && roles.includes(authState.user.role);
    },
    [authState.user],
  );

  /**
   * Auto-login para desarrollo. Solo funciona si VITE_BYPASS_AUTH está activo.
   * Loguea automáticamente con las credenciales de VITE_DEFAULT_USER_EMAIL
   */
  const devAutoLogin = useCallback(() => {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
    const defaultEmail =
      import.meta.env.VITE_DEFAULT_USER_EMAIL || "admin@vetcare.com";

    if (!bypassAuth) return false;
    if (authState.isAuthenticated) return true;

    // Buscar usuario en los mocks (usamos la contraseña del primero que coincida)
    const defaultUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === defaultEmail.toLowerCase(),
    );

    if (defaultUser) {
      const { password: _, ...userWithoutPassword } = defaultUser;
      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true,
      });
      return true;
    }

    return false;
  }, [authState.isAuthenticated, setAuthState]);

  return {
    // Estado
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,

    // Acciones
    login,
    logout,

    // Consultas
    hasRole,
    hasAnyRole,

    // Desarrollo
    devAutoLogin,
  };
}
