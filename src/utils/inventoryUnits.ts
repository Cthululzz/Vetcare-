import type { InventoryItem, InventoryMovement } from "../types/inventory";

const LOCALE = "es-CL";

type UnitFamily = "peso" | "volumen";

interface UnitInfo {
  family: UnitFamily;
  /** Factor para convertir a la unidad base de la familia (g o ml). */
  factor: number;
}

const UNIT_INFO: Record<string, UnitInfo> = {
  mg: { family: "peso", factor: 0.001 },
  g: { family: "peso", factor: 1 },
  kg: { family: "peso", factor: 1000 },
  ml: { family: "volumen", factor: 1 },
  L: { family: "volumen", factor: 1000 },
};

const PLURAL_UNITS: Record<string, string> = {
  comprimido: "comprimidos",
  pastilla: "pastillas",
  capsula: "cápsulas",
  sobre: "sobres",
  unidad: "unidades",
  frasco: "frascos",
  ampolla: "ampollas",
  gotas: "gotas",
};

const SINGULAR_UNITS: Record<string, string> = {
  gotas: "gota",
};

// ============================================
// CONVERSIÓN DE UNIDADES
// ============================================

/**
 * Convierte una cantidad entre unidades de peso o volumen.
 * Devuelve null si las unidades no son compatibles.
 */
export const convertUnit = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number | null => {
  if (!Number.isFinite(quantity)) return null;
  if (fromUnit === toUnit) return quantity;

  const from = UNIT_INFO[fromUnit];
  const to = UNIT_INFO[toUnit];
  if (!from || !to || from.family !== to.family) return null;

  return (quantity * from.factor) / to.factor;
};

/**
 * Unidades compatibles para expresar el contenido de un envase.
 * Ej: si el control es g, el envase puede venir en g, kg o mg.
 */
export const getContentUnitOptions = (baseUnit: string): string[] => {
  switch (baseUnit) {
    case "g":
      return ["g", "kg", "mg"];
    case "kg":
      return ["kg", "g"];
    case "mg":
      return ["mg", "g"];
    case "ml":
      return ["ml", "L"];
    case "L":
      return ["L", "ml"];
    default:
      return [baseUnit];
  }
};

/**
 * Contenido de un envase expresado en la unidad de control del producto.
 */
export const getContentInBaseUnit = (
  item: Pick<InventoryItem, "contentPerPackage" | "contentUnit" | "unit">,
): number | null => {
  if (
    item.contentPerPackage == null ||
    !item.contentUnit ||
    !item.unit ||
    item.contentPerPackage <= 0
  ) {
    return null;
  }

  return convertUnit(item.contentPerPackage, item.contentUnit, item.unit);
};

export const hasPresentation = (
  item: Pick<
    InventoryItem,
    "packageType" | "contentPerPackage" | "contentUnit" | "unit"
  >,
): boolean => Boolean(item.packageType && getContentInBaseUnit(item));

/** Indica si la unidad de control es de peso o volumen (g, mg, kg, ml, L). */
export const isMeasuredUnit = (unit: string): boolean => Boolean(UNIT_INFO[unit]);

const roundQuantity = (value: number): number => Math.round(value * 100) / 100;

// ============================================
// FORMATO DE CANTIDADES
// ============================================

export const formatQuantity = (value: number): string =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(value);

export const formatInteger = (value: number): string =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);

const getUnitName = (value: number, unit: string): string => {
  if (Math.abs(value) === 1) {
    return SINGULAR_UNITS[unit] ?? unit;
  }
  return PLURAL_UNITS[unit] ?? unit;
};

export const formatQuantityWithUnit = (value: number, unit: string): string =>
  `${formatQuantity(value)} ${getUnitName(value, unit)}`.trim();

export const formatPackagePlural = (type: string, quantity: number): string => {
  if (!type) return "";
  if (Math.abs(quantity) === 1) return type;
  if (type.endsWith("z")) return `${type.slice(0, -1)}ces`;
  if (type.endsWith("d")) return `${type}es`;
  return `${type}s`;
};

/**
 * Muestra una fracción simple cuando aplica: 0.5 → ½, 1.25 → 1¼.
 */
export const formatFraction = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  const whole = Math.floor(rounded);
  const decimals = Math.round((rounded - whole) * 100);
  const fractions: Record<number, string> = {
    25: "¼",
    50: "½",
    75: "¾",
  };

  const fraction = fractions[decimals];
  if (!fraction) return formatQuantity(rounded);
  return whole > 0 ? `${whole}${fraction}` : fraction;
};

/**
 * Formatea una dosis, usando fracciones para comprimidos y pastillas.
 */
export const formatFractionWithUnit = (
  value: number,
  unit: string,
): string => {
  const fraction = formatFraction(value);
  const isFraction = fraction !== formatQuantity(value);

  if (isFraction) {
    const name = value > 1 ? getUnitName(value, unit) : unit;
    return `${fraction} ${name}`.trim();
  }

  return formatQuantityWithUnit(value, unit);
};

// ============================================
// FORMATO DE STOCK Y PRESENTACIÓN
// ============================================

/**
 * Describe la presentación del producto: "sachet de 85 g", "caja de 100 comprimidos".
 */
export const formatPresentation = (
  item: Pick<
    InventoryItem,
    "packageType" | "contentPerPackage" | "contentUnit"
  >,
): string | null => {
  if (
    !item.packageType ||
    item.contentPerPackage == null ||
    !item.contentUnit
  ) {
    return null;
  }

  return `${item.packageType} de ${formatQuantity(
    item.contentPerPackage,
  )} ${item.contentUnit}`;
};

/**
 * Descompone el stock en envases completos + cantidad suelta.
 * Ej: 1.765 g con sachets de 85 g → "20 sachets + 65 g".
 */
export const formatStockBreakdown = (item: InventoryItem): string | null => {
  const contentInBase = getContentInBaseUnit(item);
  if (!item.packageType || !contentInBase || contentInBase <= 0) return null;

  const fullPackages = Math.floor(item.currentStock / contentInBase);
  const remainder =
    Math.round((item.currentStock - fullPackages * contentInBase) * 100) / 100;

  const parts: string[] = [];
  if (fullPackages > 0) {
    parts.push(
      `${formatInteger(fullPackages)} ${formatPackagePlural(
        item.packageType,
        fullPackages,
      )}`,
    );
  }
  if (remainder > 0) {
    parts.push(formatFractionWithUnit(remainder, item.unit));
  }

  return parts.length > 0 ? parts.join(" + ") : formatQuantityWithUnit(0, item.unit);
};

/**
 * Expresa una cantidad en envases, con fracciones simples: 400 g de una lata
 * de 400 g → "1 lata"; 200 g → "½ lata"; 7.800 g → "19½ latas".
 */
export const formatQuantityInPackages = (
  quantity: number,
  item: Pick<
    InventoryItem,
    "packageType" | "contentPerPackage" | "contentUnit" | "unit"
  >,
): string | null => {
  const contentInBase = getContentInBaseUnit(item);
  if (!item.packageType || !contentInBase || contentInBase <= 0) return null;

  const packages = roundQuantity(quantity / contentInBase);
  const display = formatFraction(packages);
  const singular =
    packages > 0 &&
    packages <= 1 &&
    display !== formatQuantity(packages);

  return `${display} ${
    singular
      ? item.packageType
      : formatPackagePlural(item.packageType, packages)
  }`.trim();
};

/**
 * Texto principal de una cantidad: envases cuando el control es en peso o
 * volumen, o la unidad de control (comprimidos, gotas) en el resto de casos.
 */
export const formatQuantityDisplay = (
  quantity: number,
  item: Pick<
    InventoryItem,
    "packageType" | "contentPerPackage" | "contentUnit" | "unit"
  >,
): string => {
  if (isMeasuredUnit(item.unit)) {
    const packages = formatQuantityInPackages(quantity, item);
    if (packages) return packages;
  }

  return formatFractionWithUnit(quantity, item.unit);
};

export interface StockDisplay {
  primary: string;
  detail: string | null;
  detailLabel: "Total interno" | "Equivale a" | null;
}

/**
 * Stock listo para mostrar: primero los envases (latas, sachets) y debajo el
 * total interno en la unidad real; para conteos, primero la unidad y debajo
 * el desglose en cajas.
 */
export const getStockDisplay = (item: InventoryItem): StockDisplay => {
  const usesPackages =
    isMeasuredUnit(item.unit) && Boolean(getContentInBaseUnit(item));

  if (usesPackages) {
    return {
      primary: formatQuantityDisplay(item.currentStock, item),
      detail: formatQuantityWithUnit(item.currentStock, item.unit),
      detailLabel: "Total interno",
    };
  }

  const primary = formatQuantityDisplay(item.currentStock, item);
  const breakdown = formatStockBreakdown(item);

  return {
    primary,
    detail: breakdown && breakdown !== primary ? breakdown : null,
    detailLabel: "Equivale a",
  };
};

/**
 * Cantidad de envases equivalentes a una cantidad en unidad de control.
 */
export const formatPackageEquivalence = (
  quantity: number,
  item: Pick<
    InventoryItem,
    "packageType" | "contentPerPackage" | "contentUnit" | "unit"
  >,
): string | null => {
  const packages = formatQuantityInPackages(quantity, item);
  return packages ? `≈ ${packages}` : null;
};

// ============================================
// MOVIMIENTOS
// ============================================

/**
 * Texto de cantidad de un movimiento, usando la unidad guardada o la del producto.
 */
export const formatMovementQuantity = (
  movement: InventoryMovement,
  product?: InventoryItem,
): string => {
  const unit = movement.unit ?? product?.unit ?? "";
  return formatQuantityWithUnit(movement.quantity, unit);
};

/**
 * Detalle de un movimiento ingresado por envases: "25 sachets × 85 g".
 */
export const formatMovementPackages = (
  movement: InventoryMovement,
): string | null => {
  if (
    movement.packageQuantity == null ||
    !movement.packageType ||
    movement.packageContent == null ||
    !movement.packageContentUnit
  ) {
    return null;
  }

  return `${formatQuantity(movement.packageQuantity)} ${formatPackagePlural(
    movement.packageType,
    movement.packageQuantity,
  )} × ${formatQuantity(movement.packageContent)} ${
    movement.packageContentUnit
  }`;
};

/**
 * Equivalencia en envases de un movimiento de salida: 200 g → "≈ ½ lata".
 */
export const formatMovementEquivalence = (
  movement: InventoryMovement,
  product?: InventoryItem,
): string | null => {
  if (
    !product ||
    movement.type === "ingreso" ||
    movement.type === "ajuste" ||
    !isMeasuredUnit(product.unit)
  ) {
    return null;
  }

  return formatPackageEquivalence(movement.quantity, product);
};
