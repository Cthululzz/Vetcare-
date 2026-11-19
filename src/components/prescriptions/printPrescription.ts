import { buildPrescriptionHtml } from "../../components/print/printHelpers";
import type { Prescription } from "../../types/prescription";
import { formatDateTimeShort } from "../../utils/dateUtils";
import { escapeHtml, printDocument } from "../../utils/print";

/**
 * Envía una receta al diálogo de impresión del navegador.
 * printDocument escapa el título y el subtítulo; el cuerpo se arma aparte y
 * por eso la referencia incluida en él se escapa explícitamente.
 */
export function printPrescription(
  prescription: Prescription,
  patientName: string,
  veterinarian?: string,
): void {
  const fechaEmision = formatDateTimeShort(prescription.createdAt);
  const cuerpo = buildPrescriptionHtml({
    createdAt: prescription.createdAt,
    medications: prescription.medications.map((medication) => ({
      name: medication.name,
      instructions: medication.instructions,
    })),
    notes: prescription.notes,
    patientName,
    veterinarian,
  });
  const referencia = `<p class="notas">N° de receta: ${escapeHtml(prescription.id.slice(0, 8))}</p>`;

  printDocument({
    title: "Receta médica",
    subtitle: `Paciente: ${patientName} · Emitida el ${fechaEmision}`,
    clinicName: "VetCare+",
    bodyHtml: `${cuerpo}${referencia}`,
  });
}
