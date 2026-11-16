// ============================================
// RECORDATORIOS POR WHATSAPP (enlaces wa.me)
// ============================================
// No usa WhatsApp Business API: solo genera enlaces prellenados
// que el usuario abre manualmente desde el navegador.

/**
 * Normaliza un teléfono chileno al formato que espera wa.me (solo dígitos, con 56).
 * Ejemplo: "+56 9 1234 5678" → "56912345678"
 */
export const normalizePhone = (phone: string): string => {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("56")) return digits;
  if (digits.length === 9 && digits.startsWith("9")) return `56${digits}`;
  return digits;
};

/**
 * Construye una URL de WhatsApp con mensaje prellenado.
 */
export const buildWhatsAppLink = (phone: string, message: string): string => {
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

/**
 * Saludo según la hora local del envío.
 */
export const buildTimeGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

/**
 * Mensaje de recordatorio de revisión para un paciente hospitalizado.
 * El remitente es la sucursal/establecimiento, nunca el nombre de la app.
 */
export const buildReviewReminderMessage = (params: {
  patientName: string;
  reviewDate: string;
  sucursal?: string;
}): string => {
  const sender = params.sucursal?.trim() || "la clínica veterinaria";

  return [
    `${buildTimeGreeting()},`,
    `le escribimos de ${sender} por ${params.patientName}.`,
    `Le recordamos que tiene una revisión programada para el ${params.reviewDate}.`,
    "Si tiene dudas o necesita reagendar, responda a este mensaje.",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * Mensaje con las indicaciones de alta de un paciente hospitalizado.
 */
export const buildDischargeMessage = (params: {
  patientName: string;
  sucursal?: string;
  nextControlDate?: string;
  indications?: string;
}): string => {
  const sender = params.sucursal?.trim() || "la clínica veterinaria";

  return [
    `${buildTimeGreeting()},`,
    `le escribimos de ${sender} por ${params.patientName}.`,
    params.nextControlDate
      ? `Su próximo control es el ${params.nextControlDate}.`
      : "",
    params.indications ? `Indicaciones: ${params.indications}` : "",
    "Quedamos atentos a cualquier duda.",
  ]
    .filter(Boolean)
    .join(" ");
};

// ============================================
// RECORDATORIOS DE CITAS
// ============================================
// Se envían dos avisos al propietario: 24 horas y 1 hora antes de la cita.
// El texto cambia según el aviso para que el mensaje tenga sentido.

export type AppointmentReminderKind = "24h" | "1h";

export const buildAppointmentReminderMessage = (params: {
  patientName: string;
  ownerName?: string;
  dateLabel: string;
  timeLabel: string;
  doctorName?: string;
  sucursal?: string;
  kind: AppointmentReminderKind;
}): string => {
  const sender = params.sucursal?.trim() || "la clínica veterinaria";
  const patient = params.patientName?.trim() || "su mascota";
  const greeting = params.ownerName
    ? `${buildTimeGreeting()}, ${params.ownerName}.`
    : `${buildTimeGreeting()},`;

  const when =
    params.kind === "24h"
      ? `Le recordamos que ${patient} tiene una hora agendada para el ${params.dateLabel} a las ${params.timeLabel}.`
      : `Le recordamos que ${patient} tiene una hora agendada para hoy a las ${params.timeLabel}.`;

  const professional = params.doctorName
    ? `La atención será con ${params.doctorName}.`
    : "";

  const closing =
    params.kind === "24h"
      ? "Si necesita reagendar, responda a este mensaje."
      : "Le esperamos. Si no puede asistir, responda a este mensaje.";

  return [greeting, `Le escribimos de ${sender}.`, when, professional, closing]
    .filter(Boolean)
    .join(" ");
};
