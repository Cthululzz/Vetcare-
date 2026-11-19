/** Categorías fijas que se pueden solicitar en una orden de exámenes. */
export const EXAM_CATEGORY_IDS = [
  "sangre",
  "orina_heces_muestras",
  "imagenes",
  "infecciosas_hormonas",
] as const;

export type ExamCategoryId = (typeof EXAM_CATEGORY_IDS)[number];

/** Orden de exámenes asociada a una consulta. */
export interface ExamOrder {
  categories: ExamCategoryId[];
  /** Exámenes específicos o indicaciones adicionales para el laboratorio. */
  notes?: string;
  createdAt?: string;
}
