// src/utils/formatters.ts

// Capitaliza la primera letra de un texto (ej: "firulais" -> "Firulais")
export const capitalizeText = (text: string): string => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Formatea un número a formato de moneda local (pesos/CLP o dólares)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount);
};
