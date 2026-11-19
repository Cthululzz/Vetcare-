import { escapeHtml } from "../../utils/print";

interface MedicamentoImpresion {
  name: string;
  instructions: string;
}

interface RecetaImpresion {
  createdAt: string;
  medications: MedicamentoImpresion[];
  notes?: string;
  patientName?: string;
  veterinarian?: string;
}

interface OrdenExamenImpresion {
  createdAt?: string;
  categories: string[];
  notes?: string;
  patientName?: string;
  veterinarian?: string;
}

interface ExamenClinicoImpresion {
  categories: string[];
  notes?: string;
}

interface FichaClinicaImpresion {
  date: string;
  diagnosis?: string;
  notes: string;
  recommendations?: string;
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: number;
  weightUnit?: string;
  veterinarian?: string;
  examOrder?: ExamenClinicoImpresion;
}

const valor = (texto?: string): string => {
  const limpio = texto?.trim();
  return limpio ? escapeHtml(limpio) : "—";
};

const numero = (valorNumerico?: number): string =>
  typeof valorNumerico === "number" && Number.isFinite(valorNumerico)
    ? escapeHtml(String(valorNumerico))
    : "—";

const parrafo = (texto?: string): string => {
  const limpio = texto?.trim();
  return limpio ? `<p class="notas">${escapeHtml(limpio)}</p>` : "";
};

const seccion = (titulo: string, contenido: string): string =>
  contenido
    ? `<section class="section"><h2>${escapeHtml(titulo)}</h2>${contenido}</section>`
    : "";

const listaCategorias = (
  categorias: string[],
  categoryLabels: Record<string, string>,
): string =>
  categorias
    .map((categoria) => {
      const etiqueta = categoryLabels[categoria]?.trim() || categoria;
      return `<li>${escapeHtml(etiqueta)}</li>`;
    })
    .join("");

const filaOpcional = (etiqueta: string, contenido: string): string =>
  contenido ? `<tr><th>${escapeHtml(etiqueta)}</th><td>${contenido}</td></tr>` : "";

/** Genera el cuerpo HTML de una receta médica. */
export const buildPrescriptionHtml = (prescription: RecetaImpresion): string => {
  const medicamentos = prescription.medications.length
    ? prescription.medications
        .map(
          (medicamento, indice) => `<tr>
      <td>${indice + 1}</td>
      <td>${valor(medicamento.name)}</td>
      <td>${valor(medicamento.instructions)}</td>
    </tr>`,
        )
        .join("")
    : '<tr><td colspan="3">Sin medicamentos registrados.</td></tr>';

  return `<section class="section">
  <table>
    <tbody>
      <tr><th>Fecha</th><td>${valor(prescription.createdAt)}</td></tr>
      ${filaOpcional("Paciente", valor(prescription.patientName))}
      ${filaOpcional("Veterinario", valor(prescription.veterinarian))}
    </tbody>
  </table>
</section>
<section class="section">
  <h2>Medicamentos</h2>
  <table>
    <thead><tr><th>#</th><th>Medicamento</th><th>Indicaciones</th></tr></thead>
    <tbody>${medicamentos}</tbody>
  </table>
</section>
${seccion("Observaciones", parrafo(prescription.notes))}`;
};

/** Genera el cuerpo HTML de una orden de exámenes. */
export const buildExamOrderHtml = (
  order: OrdenExamenImpresion,
  categoryLabels: Record<string, string>,
): string => {
  const categorias = listaCategorias(order.categories, categoryLabels);
  const lista = categorias
    ? `<ul>${categorias}</ul>`
    : "<p>Sin categorías registradas.</p>";

  return `<section class="section">
  <table>
    <tbody>
      <tr><th>Fecha</th><td>${valor(order.createdAt)}</td></tr>
      ${filaOpcional("Paciente", valor(order.patientName))}
      ${filaOpcional("Veterinario", valor(order.veterinarian))}
    </tbody>
  </table>
</section>
<section class="section">
  <h2>Categorías solicitadas</h2>
  ${lista}
</section>
${seccion("Indicaciones adicionales", parrafo(order.notes))}`;
};

/** Genera el cuerpo HTML de un registro clínico. */
export const buildClinicalRecordHtml = (
  record: FichaClinicaImpresion,
  categoryLabels: Record<string, string>,
  patientName?: string,
): string => {
  const unidad = record.weightUnit?.trim();
  const peso =
    typeof record.weight === "number" && Number.isFinite(record.weight)
      ? `${numero(record.weight)}${unidad ? ` ${escapeHtml(unidad)}` : ""}`
      : "—";

  const signos = [
    filaOpcional("Temperatura", valor(record.temperature)),
    filaOpcional("Frecuencia cardíaca", valor(record.heartRate)),
    filaOpcional("Frecuencia respiratoria", valor(record.respiratoryRate)),
    filaOpcional("Peso", peso),
  ].join("");

  let ordenExamen = "";
  if (record.examOrder) {
    const categorias = listaCategorias(
      record.examOrder.categories,
      categoryLabels,
    );
    const lista = categorias
      ? `<ul>${categorias}</ul>`
      : "<p>Sin categorías registradas.</p>";
    ordenExamen = seccion(
      "Orden de exámenes",
      `${lista}${parrafo(record.examOrder.notes)}`,
    );
  }

  return `<section class="section">
  <table>
    <tbody>
      <tr><th>Fecha</th><td>${valor(record.date)}</td></tr>
      ${filaOpcional("Paciente", valor(patientName))}
      ${filaOpcional("Veterinario", valor(record.veterinarian))}
      ${signos}
    </tbody>
  </table>
</section>
${seccion("Diagnóstico", parrafo(record.diagnosis))}
${seccion("Observaciones clínicas", parrafo(record.notes))}
${seccion("Recomendaciones", parrafo(record.recommendations))}
${ordenExamen}`;
};
