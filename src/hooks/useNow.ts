import { useEffect, useState } from "react";

/** Fuente del "ahora" fuera del render, para no llamar Date.now() en componentes. */
const currentTime = (): number => Date.now();

/**
 * Marca de tiempo que se renueva sola. Permite que las tareas que pasan a estar
 * "en hora" empiecen a parpadear sin necesidad de recargar la página.
 */
export const useNow = (intervalMs = 10_000): number => {
  const [now, setNow] = useState(currentTime);

  useEffect(() => {
    const tick = () => setNow(currentTime());
    const interval = window.setInterval(tick, intervalMs);
    // Si la pestaña estuvo en segundo plano, al volver se actualiza al instante.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);

  return now;
};
