import { DEFAULT_ORGANIZATION_ID } from "./appConstants";
import type { StoredUser } from "../types/user";

// Usuarios de desarrollo. Se usan solo cuando VITE_BYPASS_AUTH=true para
// mantener el flujo de pruebas; la instalación real arranca sin usuarios y
// muestra el asistente de creación del primer administrador.
export const DEMO_USERS: StoredUser[] = [
  {
    id: "user-001",
    email: "admin@vetcare.com",
    password: "admin123",
    name: "Dr. Silva",
    role: "ADMIN",
    organizationId: DEFAULT_ORGANIZATION_ID,
    sucursalId: "centro",
    createdAt: "2026-01-01T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "user-002",
    email: "vet@vetcare.com",
    password: "vet123",
    name: "Dra. Gómez",
    role: "VET",
    organizationId: DEFAULT_ORGANIZATION_ID,
    sucursalId: "norte",
    createdAt: "2026-01-01T00:00:00.000Z",
    isActive: true,
  },
  {
    id: "user-003",
    email: "recepcion@vetcare.com",
    password: "recep123",
    name: "María Pérez",
    role: "RECEPTIONIST",
    organizationId: DEFAULT_ORGANIZATION_ID,
    sucursalId: "sur",
    createdAt: "2026-01-01T00:00:00.000Z",
    isActive: true,
  },
];
