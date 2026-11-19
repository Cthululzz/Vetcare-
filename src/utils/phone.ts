/** Normaliza teléfonos chilenos para comparar dueños sin duplicarlos. */
export const normalizePhone = (phone: string): string => {
  const digitos = (phone ?? "").replace(/\D/g, "");
  if (/^56\d{9}$/.test(digitos)) return digitos.slice(2);
  return digitos;
};
