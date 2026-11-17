/** Valor que se registra cuando el usuario deja un signo vital sin completar. */
export const VALOR_SIGNO_VITAL_NORMAL = "normal";

/**
 * Normaliza un signo vital: si viene vacío se registra como "normal".
 * Se usa tanto en el borrador de la cita como en el historial médico.
 */
export const normalizeVitalSign = (value?: string): string =>
  value?.trim() || VALOR_SIGNO_VITAL_NORMAL;
