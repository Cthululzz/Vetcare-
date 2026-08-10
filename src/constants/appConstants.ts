// src/constants/appConstants.ts

export const SUCURSALES = [
  { id: "centro", name: "Sucursal Principal - Centro" },
  { id: "norte", name: "Sucursal Norte" },
] as const;

export const ROLES_USUARIO = {
  ADMIN: "Administrador",
  VET: "Médico Veterinario",
  RECEPTIONIST: "Recepcionista",
} as const;

export const APP_CONFIG = {
  appName: "VetFlow Manager",
  version: "1.0.0",
} as const;
