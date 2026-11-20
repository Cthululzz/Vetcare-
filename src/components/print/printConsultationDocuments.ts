import type { FinishPrintDocuments } from "../../types/consultation";
import { printDocument } from "../../utils/print";
import { buildPrescriptionPrintBody } from "../prescriptions/printPrescription";
import { buildExamOrderPrintBody } from "./printExamOrder";

/**
 * Imprime en un solo diálogo los documentos seleccionados al finalizar una
 * consulta. Cada documento va en su propia página, con su título, para que se
 * puedan entregar juntos al cliente sin hojas pegadas.
 */
export function printConsultationDocuments(
  documents: FinishPrintDocuments,
): void {
  const { prescription, examOrder, patientName, veterinarian } = documents;
  const imprimirReceta = Boolean(prescription);
  const imprimirOrden = Boolean(examOrder?.categories.length);
  if (!imprimirReceta && !imprimirOrden) return;

  const ambos = imprimirReceta && imprimirOrden;
  const conTitulo = (titulo: string, html: string): string =>
    ambos
      ? `<section class="section"><h1 class="title">${titulo}</h1>${html}</section>`
      : html;

  const partes: string[] = [];

  if (prescription) {
    partes.push(
      conTitulo(
        "Receta médica",
        buildPrescriptionPrintBody(prescription, patientName, veterinarian),
      ),
    );
  }

  if (examOrder && imprimirOrden) {
    partes.push(
      conTitulo(
        "Orden de exámenes",
        buildExamOrderPrintBody(
          {
            ...examOrder,
            createdAt: examOrder.createdAt ?? new Date().toISOString(),
          },
          patientName,
          veterinarian,
        ),
      ),
    );
  }

  const titulo = ambos
    ? "Documentos de consulta"
    : imprimirReceta
      ? "Receta médica"
      : "Orden de exámenes";

  const saltoPagina =
    '<style>.page-break { break-before: page; page-break-before: always; }</style>';

  printDocument({
    title: titulo,
    subtitle: `Paciente: ${patientName}`,
    clinicName: "VetCare+",
    bodyHtml: `${saltoPagina}${partes.join('<div class="page-break"></div>')}`,
  });
}
