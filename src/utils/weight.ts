// ============================================
// PESO CORPORAL DEL PACIENTE
// ============================================
// El peso se guarda junto a su unidad (kg o g). Los registros antiguos no
// tienen unidad y se interpretan como kilogramos.

export type WeightUnit = "kg" | "g";

export const WEIGHT_UNITS: WeightUnit[] = ["kg", "g"];

export const DEFAULT_WEIGHT_UNIT: WeightUnit = "kg";

/** Normaliza una unidad desconocida a kg (compatibilidad con datos antiguos). */
export const normalizeWeightUnit = (
  unit?: string | null,
): WeightUnit => (unit === "g" ? "g" : "kg");

/** Convierte un peso a kilogramos para comparar valores entre registros. */
export const toKilograms = (
  value?: number | null,
  unit?: string | null,
): number | null => {
  if (value == null || !Number.isFinite(value)) return null;
  return normalizeWeightUnit(unit) === "g" ? value / 1000 : value;
};

/** Convierte un peso entre kg y g, redondeando a dos decimales. */
export const convertWeight = (
  value: number,
  from?: string | null,
  to?: string | null,
): number => {
  const fromUnit = normalizeWeightUnit(from);
  const toUnit = normalizeWeightUnit(to);
  if (fromUnit === toUnit) return value;
  if (fromUnit === "kg" && toUnit === "g") {
    return Math.round(value * 1000 * 100) / 100;
  }
  return Math.round((value / 1000) * 100) / 100;
};

/**
 * Formatea un peso con su unidad.
 * Ej: 12.5 kg → "12,5 kg" · 850 g → "850 g"
 */
export const formatWeightWithUnit = (
  value?: number | null,
  unit?: string | null,
): string => {
  if (value == null || !Number.isFinite(value)) return "Sin registrar";

  const normalized = normalizeWeightUnit(unit);
  const formatted = new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: normalized === "kg" ? 2 : 0,
  }).format(value);

  return `${formatted} ${normalized}`;
};
