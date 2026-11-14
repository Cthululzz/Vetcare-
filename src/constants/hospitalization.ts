// ============================================
// CONFIGURACIÓN DEL ÁREA DE HOSPITALIZACIÓN
// ============================================

/**
 * Camas físicas disponibles en el área de hospitalización.
 * La ocupación se deriva de las internaciones activas (nunca se guarda aparte).
 */
export const CAMAS_HOSPITALIZACION = Array.from(
  { length: 10 },
  (_, index) => `Cama ${String(index + 1).padStart(2, "0")}`,
);

/**
 * Frecuencias de monitoreo permitidas, en horas.
 */
export const FRECUENCIAS_MONITOREO = [
  { value: 2, label: "Cada 2 horas" },
  { value: 4, label: "Cada 4 horas" },
  { value: 6, label: "Cada 6 horas" },
  { value: 8, label: "Cada 8 horas" },
  { value: 12, label: "Cada 12 horas" },
  { value: 24, label: "Cada 24 horas" },
] as const;

export const DEFAULT_MONITORING_FREQUENCY = 8;

/**
 * Calcula la próxima revisión a partir de una fecha base y una frecuencia en horas.
 */
export const calcularProximaRevision = (
  frequencyHours: number,
  from: Date = new Date(),
): string =>
  new Date(from.getTime() + frequencyHours * 60 * 60 * 1000).toISOString();
