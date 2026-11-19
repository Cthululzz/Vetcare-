/**
 * El bypass existe solo para desarrollo local. Vite incorpora las variables
 * VITE_* al bundle, así que en una compilación de producción nunca se aplica,
 * aunque el .env versionado siga trayendo VITE_BYPASS_AUTH=true.
 */
export const isBypassAuthEnabled = (): boolean =>
  import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === "true";
