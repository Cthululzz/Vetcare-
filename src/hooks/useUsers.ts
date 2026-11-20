import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { DEFAULT_ORGANIZATION_ID } from "../constants/appConstants";
import type { SucursalId, UserRole } from "../constants/appConstants";
import { DEMO_USERS } from "../constants/demoUsers";
import { isBypassAuthEnabled } from "../utils/authBypass";
import type { StoredUser, User } from "../types/user";

export const USERS_KEY = "vet_users";

export interface NewUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  sucursalId: SucursalId;
  /** Organización real de la licencia; si se omite se usa la de desarrollo. */
  organizationId?: string;
}

export interface UserUpdates {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  sucursalId?: SucursalId;
  isActive?: boolean;
}

/** Separa la contraseña antes de entregar el usuario al resto de la app. */
export const toPublicUser = (user: StoredUser): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  sucursalId: user.sucursalId,
  organizationId: user.organizationId,
  createdAt: user.createdAt,
  isActive: user.isActive,
  ...(user.avatar ? { avatar: user.avatar } : {}),
});

export function useUsers() {
  const bypass = isBypassAuthEnabled();
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>(
    USERS_KEY,
    bypass ? DEMO_USERS : [],
  );

  const users = useMemo(
    () => storedUsers.map(toPublicUser),
    [storedUsers],
  );
  // El asistente de instalación debe reaparecer si no queda ningún administrador
  // activo; la cuenta fija del proveedor no cuenta para este efecto.
  const hasUsers = users.some(
    (user) => user.role !== "PROVEEDOR" && user.isActive !== false,
  );

  const findByCredentials = useCallback(
    (email: string, password: string): User | undefined => {
      const normalizedEmail = email.trim().toLowerCase();
      const found = storedUsers.find(
        (user) =>
          user.email.toLowerCase() === normalizedEmail &&
          user.password === password &&
          user.isActive !== false,
      );
      return found ? toPublicUser(found) : undefined;
    },
    [storedUsers],
  );

  const emailExists = useCallback(
    (email: string, exceptId?: string): boolean => {
      const normalizedEmail = email.trim().toLowerCase();
      return storedUsers.some(
        (user) =>
          user.email.toLowerCase() === normalizedEmail && user.id !== exceptId,
      );
    },
    [storedUsers],
  );

  const createUser = useCallback(
    (data: NewUserData): User => {
      const user: StoredUser = {
        ...data,
        id: crypto.randomUUID(),
        organizationId: data.organizationId ?? DEFAULT_ORGANIZATION_ID,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      setStoredUsers((prev) => [...prev, user]);
      return toPublicUser(user);
    },
    [setStoredUsers],
  );

  const updateUser = useCallback(
    (id: string, updates: UserUpdates): void => {
      setStoredUsers((prev) =>
        prev.map((user) => (user.id === id ? { ...user, ...updates } : user)),
      );
    },
    [setStoredUsers],
  );

  const removeUser = useCallback(
    (id: string): void => {
      setStoredUsers((prev) => prev.filter((user) => user.id !== id));
    },
    [setStoredUsers],
  );

  return {
    users,
    storedUsers,
    hasUsers,
    findByCredentials,
    emailExists,
    createUser,
    updateUser,
    removeUser,
  };
}
