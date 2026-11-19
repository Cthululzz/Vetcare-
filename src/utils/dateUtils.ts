// ============================================
// UTILIDADES DE FECHA Y HORA
// ============================================

/**
 * Obtiene la fecha actual en formato local "yyyy-mm-dd" (evita desfases UTC)
 */
export const getLocalTodayStr = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formatea fecha ISO a formato legible: "Miércoles, 12 de agosto de 2026"
 */
export const formatLocalDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const formatted = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * Formatea fecha ISO a formato corto: "12/08/2026"
 */
export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * Formatea un Date local a "dd/mm/aaaa".
 */
export const formatDateDMY = (date: Date): string =>
  `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

/**
 * Formatea un Date local a "dd/mm/aaaa HH:MM".
 */
export const formatDateTimeDMY = (date: Date): string =>
  `${formatDateDMY(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

/**
 * Formatea una fecha-hora ISO a "dd/mm/aaaa HH:MM" en hora local.
 */
export const formatDateTimeShort = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateTimeDMY(date);
};

/**
 * Convierte una fecha escrita como "dd/mm/aaaa" a ISO "aaaa-mm-dd".
 * Devuelve null si el texto o la fecha no son válidos.
 */
export const parseDisplayDateToIso = (value: string): string | null => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

/**
 * Formatea hora 24h a formato legible: "14:30" → "2:30 PM"
 */
export const formatTime = (time24h: string): string => {
  if (!time24h) return "";
  const [hours, minutes] = time24h.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

/**
 * Convierte hora "2:30 PM" a formato 24h: "14:30"
 */
export const parseTimeTo24h = (time12h: string): string => {
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12h;

  const [, hours, minutes, period] = match;
  let hoursNum = parseInt(hours, 10);

  if (period.toUpperCase() === "PM" && hoursNum !== 12) {
    hoursNum += 12;
  } else if (period.toUpperCase() === "AM" && hoursNum === 12) {
    hoursNum = 0;
  }

  return `${String(hoursNum).padStart(2, "0")}:${minutes}`;
};

/** Normaliza una hora a HH:MM. Devuelve null si no es válida. */
export const normalizarHora = (valor: string): string | null => {
  const texto = (valor ?? "").trim();
  const coincidencia = /^(\d{1,2}):(\d{2})$/.exec(texto);
  if (!coincidencia) return null;

  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) return null;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
};

/**
 * Calcula edad en años y meses desde una fecha de nacimiento ISO
 */
export const calculateAge = (birthDate: string): string => {
  if (!birthDate) return "No especificada";

  // "yyyy-mm-dd" se interpreta como fecha local, no como ISO UTC.
  const [anio, mes, dia] = birthDate.slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "No especificada";

  const birth = new Date(anio, mes - 1, dia);
  const now = new Date();

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return months > 0
      ? `${years} año${years > 1 ? "s" : ""} ${months} mes${months > 1 ? "es" : ""}`
      : `${years} año${years > 1 ? "s" : ""}`;
  } else {
    return `${months} mes${months > 1 ? "es" : ""}`;
  }
};

/**
 * Compara dos fechas (solo día, ignora hora)
 */
export const compareDates = (date1: string, date2: string): number => {
  return date1.localeCompare(date2);
};

/**
 * Verifica si una fecha es hoy
 */
export const isToday = (dateStr: string): boolean => {
  return dateStr === getLocalTodayStr();
};

/**
 * Verifica si una fecha es mañana
 */
export const isTomorrow = (dateStr: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === getLocalTodayStr(tomorrow);
};

/**
 * Obtiene los 7 días de la semana actual (lunes a domingo)
 */
export const getWeekDays = (
  fechaReferencia?: string,
): Array<{ name: string; dateStr: string }> => {
  const ahora = fechaReferencia
    ? new Date(`${fechaReferencia}T12:00:00`)
    : new Date();
  const now = Number.isNaN(ahora.getTime()) ? new Date() : ahora;
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const weekDays: Array<{ name: string; dateStr: string }> = [];
  const dayNames = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push({
      name: dayNames[i],
      dateStr: getLocalTodayStr(d),
    });
  }
  return weekDays;
};

/**
 * Formatea fecha ISO a formato LATAM: "14 ago 2026"
 */
export const formatDateLatam = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];

  return `${day} ${months[date.getMonth()]} ${year}`;
};

/**
 * Convierte hora en formato "10:30", "10:30 AM", "2:45 PM" a minutos desde medianoche
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  let cleanStr = timeStr.trim().toUpperCase();
  const isPM = cleanStr.includes("PM");
  const isAM = cleanStr.includes("AM");

  cleanStr = cleanStr.replace("AM", "").replace("PM", "").trim();
  const parts = cleanStr.split(":");
  if (parts.length < 2) return 0;

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Ordena citas por fecha y hora (maneja AM/PM correctamente)
 */
export const sortAppointmentsByDateTime = <
  T extends { fecha: string; hora: string },
>(
  appointments: T[],
): T[] => {
  return [...appointments].sort((a, b) => {
    const dateCompare = a.fecha.localeCompare(b.fecha);
    if (dateCompare !== 0) return dateCompare;

    const minA = parseTimeToMinutes(a.hora);
    const minB = parseTimeToMinutes(b.hora);
    return minA - minB;
  });
};

/**
 * Obtiene la edad a mostrar de un paciente.
 * Prioridad: edad registrada como texto → edad calculada desde birthDate → "No registrada"
 */
export const getPatientDisplayAge = (p: {
  age?: string;
  birthDate?: string;
}): string => {
  if (p.age && p.age.trim()) return p.age;
  if (p.birthDate) return calculateAge(p.birthDate);
  return "No registrada";
};

/**
 * Convierte una edad en texto (ej. "3 años y 2 meses") a una fecha de nacimiento
 * aproximada (YYYY-MM-01). Solo calcula mes y año, sin día.
 * Retorna null si no puede interpretar la edad.
 */
export const parseAgeToBirthDate = (ageText: string): string | null => {
  const text = (ageText || "").toLowerCase().trim();
  if (!text) return null;

  const yearsMatch = text.match(/(\d+)\s*a/); // "años" / "anos" / "a"
  const monthsMatch = text.match(/(\d+)\s*m/); // "meses" / "mes" / "m"

  let years = yearsMatch ? parseInt(yearsMatch[1], 10) : 0;
  const months = monthsMatch ? parseInt(monthsMatch[1], 10) : 0;

  // Si no hay palabras clave, un número solo se interpreta como años
  if (!yearsMatch && !monthsMatch) {
    const lone = text.match(/(\d+)/);
    if (lone) years = parseInt(lone[1], 10);
  }

  const totalMonths = years * 12 + months;
  if (totalMonths <= 0) return null;

  const now = new Date();
  const birth = new Date(now.getFullYear(), now.getMonth() - totalMonths, 1);
  const y = birth.getFullYear();
  const m = String(birth.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
};
