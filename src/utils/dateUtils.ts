// src/utils/dateUtils.ts

// Obtiene la fecha actual en formato local "yyyy-mm-dd" (evita desfases UTC)
export const getLocalTodayStr = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Formatea una fecha ISO a un formato legible en español (ej: "29 de Julio, 2026")
export const formatLocalDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
