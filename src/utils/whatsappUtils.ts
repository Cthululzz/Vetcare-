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
 * Mensaje de recordatorio de revisión para un paciente hospitalizado.
 * El remitente es la sucursal/establecimiento, nunca el nombre de la app.
 */
export const buildReviewReminderMessage = (params: {
  ownerName?: string;
  patientName: string;
  reviewDate: string;
  sucursal?: string;
}): string => {
  const greeting = params.ownerName
    ? `Hola ${params.ownerName},`
    : "Hola,";
  const sender = params.sucursal?.trim() || "la clínica veterinaria";

  return [
    greeting,
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
  ownerName?: string;
  patientName: string;
  sucursal?: string;
  nextControlDate?: string;
  indications?: string;
}): string => {
  const greeting = params.ownerName
    ? `Hola ${params.ownerName},`
    : "Hola,";
  const sender = params.sucursal?.trim() || "la clínica veterinaria";

  return [
    greeting,
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
