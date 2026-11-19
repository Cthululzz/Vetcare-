/**
 * El bypass existe solo para desarrollo local. Vite incorpora las variables
 * VITE_* al bundle, así que en una compilación de producción nunca se aplica,
 * aunque el .env versionado siga trayendo VITE_BYPASS_AUTH=true.
 *
 * Si el usuario cierra sesión en desarrollo, se guarda una marca de sesión para
 * que el auto-login no vuelva a iniciarla de inmediato. La marca se puede
 * revertir desde el propio componente DevAuthBypass.
 */

const DEV_BYPASS_OPT_OUT_KEY = "vet_dev_bypass_optout";

const isDevBypassOptedOut = (): boolean =>
  sessionStorage.getItem(DEV_BYPASS_OPT_OUT_KEY) === "true";

export const isBypassAuthEnabled = (): boolean =>
  import.meta.env.DEV &&
  import.meta.env.VITE_BYPASS_AUTH === "true" &&
  !isDevBypassOptedOut();

/** Llama al cerrar sesión para que el auto-login no vuelva a entrar. */
export const disableDevBypassForSession = (): void => {
  sessionStorage.setItem(DEV_BYPASS_OPT_OUT_KEY, "true");
};

/** Rehabilita el auto-login de desarrollo. */
export const restoreDevBypass = (): void => {
  sessionStorage.removeItem(DEV_BYPASS_OPT_OUT_KEY);
};

/** True cuando el entorno tiene el bypass configurado, esté activo o no. */
export const isDevBypassConfigured = (): boolean =>
  import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === "true";
