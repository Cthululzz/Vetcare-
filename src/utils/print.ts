/** Escapa texto para insertarlo de forma segura dentro de HTML generado. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  clinicName?: string;
  bodyHtml: string;
}

const construirHtml = (options: PrintDocumentOptions): string => {
  const titulo = escapeHtml(options.title);
  const clinica = escapeHtml(options.clinicName?.trim() || "VetCare+");
  const subtitulo = options.subtitle?.trim()
    ? `<p class="subtitle">${escapeHtml(options.subtitle.trim())}</p>`
    : "";
  const impreso = escapeHtml(new Date().toLocaleString("es-ES"));

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${titulo}</title>
    <style>
      @page { size: A4; margin: 16mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.45;
      }
      .document { max-width: 178mm; margin: 0 auto; }
      .header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 2px solid #111827;
        padding-bottom: 12px;
        margin-bottom: 18px;
      }
      .clinic { font-size: 16px; font-weight: 700; }
      .title { margin: 10px 0 0; font-size: 20px; line-height: 1.2; }
      .subtitle { margin: 4px 0 0; color: #4b5563; font-size: 11px; }
      .section { margin: 0 0 16px; }
      h2 {
        margin: 0 0 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #d1d5db;
        font-size: 13px;
      }
      p { margin: 0 0 8px; }
      .notas { white-space: pre-wrap; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 12px; }
      th, td {
        border: 1px solid #9ca3af;
        padding: 6px 8px;
        text-align: left;
        vertical-align: top;
      }
      th { width: 26%; background: #f3f4f6; font-weight: 700; }
      ul { margin: 0 0 8px; padding-left: 18px; }
      li { margin-bottom: 3px; }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 24px;
        padding-top: 8px;
        border-top: 1px solid #d1d5db;
        color: #6b7280;
        font-size: 10px;
      }
      .no-print {
        position: fixed;
        top: 12px;
        right: 12px;
        padding: 8px 14px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: #f3f4f6;
        color: #111827;
        font: inherit;
        cursor: pointer;
      }
      @media print {
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <button type="button" class="no-print" onclick="window.close()">
      Cerrar ventana
    </button>
    <main class="document">
      <header class="header">
        <div>
          <div class="clinic">${clinica}</div>
          <h1 class="title">${titulo}</h1>
          ${subtitulo}
        </div>
      </header>
      ${options.bodyHtml}
      <footer class="footer">
        <span>${clinica}</span>
        <span>Impreso: ${impreso}</span>
      </footer>
    </main>
  </body>
</html>`;
};

/**
 * Abre el documento en una ventana propia e invoca su window.print().
 * Imprimir desde un iframe oculto hacía que Chromium/Edge mostrara solo el
 * encabezado y el pie en la vista previa; con una ventana dedicada se imprime
 * el documento completo y el usuario puede cerrarla al terminar.
 */
export const printDocument = (options: PrintDocumentOptions): void => {
  if (typeof window === "undefined") return;

  const ventana = window.open(
    "",
    "_blank",
    "width=1024,height=768,left=80,top=80,resizable=yes,scrollbars=yes",
  );

  if (!ventana) {
    window.alert(
      "No se pudo abrir la ventana de impresión. Permite ventanas emergentes para este sitio e inténtalo nuevamente.",
    );
    return;
  }

  const html = construirHtml(options);
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();

  let impreso = false;
  const imprimir = (): void => {
    if (impreso || ventana.closed) return;
    impreso = true;
    try {
      ventana.focus();
      ventana.print();
    } catch {
      // El usuario puede imprimir manualmente desde la ventana abierta.
    }
  };

  ventana.addEventListener("load", imprimir, { once: true });
  ventana.setTimeout(imprimir, 300);
  ventana.addEventListener("afterprint", () => {
    if (!ventana.closed) ventana.close();
  });
};
