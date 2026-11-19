const MS_POR_DIA = 24 * 60 * 60 * 1000;

type FechaPartes = [number, number, number];

const parseFecha = (fecha: string): FechaPartes | null => {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? "");
  if (!coincidencia) return null;

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  return [anio, mes, dia];
};

/** Diferencia de días calendario, inmune a cambios de horario. */
export const diasDesde = (desde: string, hasta: string): number => {
  const inicio = parseFecha(desde);
  const final = parseFecha(hasta);
  if (!inicio || !final) return 0;

  const inicioUTC = Date.UTC(inicio[0], inicio[1] - 1, inicio[2]);
  const finalUTC = Date.UTC(final[0], final[1] - 1, final[2]);
  return Math.floor((finalUTC - inicioUTC) / MS_POR_DIA);
};

/** Suma meses ajustando el día a la longitud del mes destino. */
export const sumarMeses = (fecha: string, meses: number): string => {
  const partes = parseFecha(fecha);
  if (!partes) return fecha;

  const [anio, mes, dia] = partes;
  const totalMeses = anio * 12 + (mes - 1) + meses;
  const anioDestino = Math.floor(totalMeses / 12);
  const mesDestino = (totalMeses % 12) + 1;
  const diasDelMes = new Date(Date.UTC(anioDestino, mesDestino, 0)).getUTCDate();
  const diaDestino = Math.min(dia, diasDelMes);

  return `${anioDestino}-${String(mesDestino).padStart(2, "0")}-${String(diaDestino).padStart(2, "0")}`;
};

/**
 * Si la suscripción pagada ya venció, la gracia y el bloqueo se cuentan desde
 * esa fecha. Si nunca se pagó, se cuentan desde el inicio de la prueba.
 */
export const fechaBaseVencimiento = (
  trialStart: string,
  paidUntil: string | null,
  hoy: string,
): string => (paidUntil && paidUntil < hoy ? paidUntil : trialStart);
