// ============================================
// CONFIGURACIÓN DEL INVENTARIO
// ============================================

/**
 * Unidades con las que se controla el stock de un producto.
 * Deben coincidir con la forma en que se consume: un frasco de 100 ml se
 * descuenta en ml, una caja de pastillas en pastillas, etc.
 */
export const UNIDADES_INVENTARIO = [
  { value: "ml", label: "ml — mililitros" },
  { value: "mg", label: "mg — miligramos" },
  { value: "g", label: "g — gramos" },
  { value: "kg", label: "kg — kilogramos" },
  { value: "L", label: "L — litros" },
  { value: "gotas", label: "gotas" },
  { value: "pastilla", label: "pastillas" },
  { value: "comprimido", label: "comprimidos" },
  { value: "capsula", label: "cápsulas" },
  { value: "sobre", label: "sobres" },
  { value: "unidad", label: "unidades" },
  { value: "frasco", label: "frascos" },
  { value: "ampolla", label: "ampollas" },
  { value: "UI", label: "UI — unidades internacionales" },
] as const;

export const CATEGORIAS_INVENTARIO = [
  { value: "medicamento", label: "Medicamento" },
  { value: "insumo", label: "Insumo clínico" },
  { value: "alimento", label: "Alimento" },
  { value: "vacuna", label: "Vacuna" },
  { value: "suplemento", label: "Suplemento" },
  { value: "otro", label: "Otro" },
] as const;

/**
 * Unidades con que se puede expresar el contenido de un envase.
 * El stock interno se guarda en g, mg, ml o en unidades de conteo.
 */
export const UNIDADES_CONTENIDO = [
  { value: "g", label: "g — gramos" },
  { value: "kg", label: "kg — kilogramos" },
  { value: "mg", label: "mg — miligramos" },
  { value: "ml", label: "ml — mililitros" },
  { value: "L", label: "L — litros" },
  { value: "comprimido", label: "comprimidos" },
  { value: "pastilla", label: "pastillas" },
  { value: "capsula", label: "cápsulas" },
  { value: "gotas", label: "gotas" },
  { value: "sobre", label: "sobres" },
  { value: "unidad", label: "unidades" },
  { value: "UI", label: "UI — unidades internacionales" },
] as const;

/**
 * Presentaciones habituales en que llega un producto al inventario.
 * El usuario puede escribir otra si no está en la lista.
 */
export const TIPOS_PRESENTACION = [
  "lata",
  "sachet",
  "sobre",
  "caja",
  "frasco",
  "saco",
  "bolsa",
  "blíster",
  "ampolla",
  "tubo",
  "pote",
  "unidad",
] as const;

/**
 * Unidades de stock interno que se derivan del contenido del envase.
 * Los pesos se guardan en g (o mg) y los volúmenes en ml.
 */
const UNIDAD_INTERNA_POR_CONTENIDO: Record<string, string> = {
  kg: "g",
  g: "g",
  mg: "mg",
  L: "ml",
  ml: "ml",
};

export const getInternalUnit = (contentUnit: string): string =>
  UNIDAD_INTERNA_POR_CONTENIDO[contentUnit] ?? contentUnit;
