import { Dog, Cat, Star } from "lucide-react";

// ============================================
// FORMATEADORES DE PRESENTACIÓN
// ============================================

// --- Configuración de localización ---
const LOCALE = "es-CL";
const CURRENCY_CODE = "CLP";

// ============================================
// TEXTO
// ============================================

/**
 * Capitaliza la primera letra de un texto
 * Ejemplo: "firulais" → "Firulais"
 */
export const capitalizeText = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitaliza cada palabra de un texto
 * Ejemplo: "firulais perez" → "Firulais Perez"
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return "";
  return text
    .split(" ")
    .map((word) => capitalizeText(word))
    .join(" ");
};

/**
 * Trunca texto con ellipsis si excede el límite
 * Ejemplo: "Historia clínica muy larga..." (50 chars)
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || "";
  return `${text.slice(0, maxLength)}...`;
};

// ============================================
// NÚMEROS Y MONEDA
// ============================================

/**
 * Formatea un número a moneda local (CLP por defecto)
 * Ejemplo: 15000 → "$15.000"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea peso en kilogramos
 * Ejemplo: 8.5 → "8,5 kg"
 */
export const formatWeight = (kg: number): string => {
  return (
    new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(kg) + " kg"
  );
};

/**
 * Formatea número entero con separador de miles
 * Ejemplo: 1500 → "1.500"
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat(LOCALE).format(value);
};

// ============================================
// TELÉFONO
// ============================================

/**
 * Formatea un número de teléfono chileno para mejor legibilidad
 * Ejemplo: "912345678" → "+56 9 1234 5678"
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");

  // Formato chileno móvil (9 dígitos empezando con 9)
  if (cleaned.length === 9 && cleaned.startsWith("9")) {
    return `+56 ${cleaned[0]} ${cleaned.slice(1, 5)} ${cleaned.slice(5)}`;
  }

  // Formato fijo chileno (8-9 dígitos empezando con 2)
  if (cleaned.length === 8 && cleaned.startsWith("2")) {
    return `+56 2 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }

  return phone;
};

// ============================================
// ESPECIES Y TIPOS (para mostrar labels legibles)
// ============================================

/**
 * Convierte el ID de especie en label legible
 * Ejemplo: "exoticos" → "Exóticos / Otros"
 */
export const formatSpeciesLabel = (species: string): string => {
  const labels: Record<string, string> = {
    perro: "Perro",
    gato: "Gato",
    exoticos: "Exóticos / Otros",
  };
  return labels[species] || capitalizeText(species);
};

/**
 * Convierte el ID de tipo de cita en label legible
 * Ejemplo: "desparasitacion" → "Desparasitación"
 */
export const formatAppointmentTypeLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    control: "Control General",
    vacuna: "Vacunación",
    desparasitacion: "Desparasitación",
    esterilizacion: "Esterilización / Cirugía",
    urgencia: "Urgencia Médica",
  };
  return labels[tipo] || capitalizeText(tipo);
};

// ============================================
// AGENDA - ESTILOS Y CONFIGURACIÓN VISUAL
// ============================================

/**
 * Obtiene el estilo de badge según el tipo de cita
 */
export const getAppointmentBadgeStyle = (tipo: string): string => {
  const tipoLower = tipo?.toLowerCase() || "";

  switch (tipoLower) {
    case "urgencia":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "vacuna":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "desparasitacion":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "esterilizacion":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "control":
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
};

/**
 * Obtiene la configuración de glow para cards según el tipo de cita
 */
export const getAppointmentGlowConfig = (tipo: string) => {
  const tipoLower = tipo?.toLowerCase() || "";
  let colorGlow = "rgba(100, 116, 139, 0.22)"; // Slate por defecto

  switch (tipoLower) {
    case "urgencia":
      colorGlow = "rgba(239, 68, 68, 0.22)";
      break;
    case "vacuna":
      colorGlow = "rgba(16, 185, 129, 0.22)";
      break;
    case "desparasitacion":
      colorGlow = "rgba(168, 85, 247, 0.22)";
      break;
    case "esterilizacion":
      colorGlow = "rgba(59, 130, 246, 0.22)";
      break;
  }

  return {
    borderStyle:
      "border-slate-800 hover:border-slate-700 shadow-lg shadow-black/30",
    glowStyle: {
      backgroundImage: `radial-gradient(circle at 100% 100%, ${colorGlow} 0%, transparent 65%)`,
    },
  };
};

/**
 * Obtiene el ícono de mascota según especie y género
 */
export const getPetIcon = (species: string, gender?: string) => {
  const isMacho = gender === "macho";
  const isHembra = gender === "hembra";

  const iconColorStyles = isMacho
    ? "text-blue-400"
    : isHembra
      ? "text-pink-400"
      : "text-slate-400";

  const sizeClass = `w-5 h-5 ${iconColorStyles}`;

  switch (species?.toLowerCase()) {
    case "gato":
      return <Cat className={sizeClass} />;
    case "perro":
      return <Dog className={sizeClass} />;
    case "exoticos":
      return <Star className={sizeClass} />;
    default:
      return <Dog className={sizeClass} />;
  }
};
