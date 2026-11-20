import { EXAMEN_CATEGORIAS } from "../../constants/examOrders";
import { formatDateTimeShort } from "../../utils/dateUtils";
import { printDocument } from "../../utils/print";
import type { ExamOrder } from "../../types/examOrder";
import { buildExamOrderHtml } from "./printHelpers";

const CATEGORY_LABELS = Object.fromEntries(
  EXAMEN_CATEGORIAS.map(({ id, label }) => [id, label]),
);

/**
 * Construye el cuerpo HTML de una orden de exámenes. Se exporta para poder
 * combinarla con otros documentos en una sola impresión sin duplicar formato.
 */
export function buildExamOrderPrintBody(
  order: ExamOrder,
  patientName?: string,
  veterinarian?: string,
): string {
  return buildExamOrderHtml(
    {
      ...order,
      createdAt: order.createdAt
        ? formatDateTimeShort(order.createdAt)
        : undefined,
      patientName,
      veterinarian,
    },
    CATEGORY_LABELS,
  );
}

/** Envía una orden de exámenes al diálogo de impresión del navegador. */
export function printExamOrder(
  order: ExamOrder,
  patientName?: string,
  veterinarian?: string,
): void {
  printDocument({
    title: "Orden de exámenes",
    subtitle: patientName ?? undefined,
    bodyHtml: buildExamOrderPrintBody(order, patientName, veterinarian),
  });
}
