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
    </style>
  </head>
  <body>
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
 * Abre el documento en un iframe oculto e invoca su window.print().
 * El nodo se retira al cerrar el diálogo de impresión o con un temporizador.
 */
export const printDocument = (options: PrintDocumentOptions): void => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!document.body) return;

  const html = construirHtml(options);
  const iframe = document.createElement("iframe");
  iframe.title = "Documento para impresión";
  iframe.setAttribute("aria-hidden", "true");
  // Fuera de pantalla, pero sin opacity ni display:none: Chromium no imprime
  // el contenido de un iframe oculto de esas formas.
  iframe.style.cssText =
    "position:absolute;left:-9999px;top:0;width:1px;height:1px;border:0;";

  let impreso = false;
  let limpio = false;
  let temporizadorImpresion = 0;
  let temporizadorLimpieza = 0;

  const limpiar = (): void => {
    if (limpio) return;
    limpio = true;

    if (temporizadorImpresion !== 0) {
      window.clearTimeout(temporizadorImpresion);
    }
    if (temporizadorLimpieza !== 0) {
      window.clearTimeout(temporizadorLimpieza);
    }
    window.removeEventListener("afterprint", limpiar);
    try {
      iframe.contentWindow?.removeEventListener("afterprint", limpiar);
    } catch {
      // El acceso al iframe puede estar restringido; la limpieza continúa.
    }

    window.setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        // El nodo ya pudo ser retirado por el navegador.
      }
    }, 500);
  };

  const imprimir = (): void => {
    if (impreso || limpio) return;
    impreso = true;
    if (temporizadorImpresion !== 0) {
      window.clearTimeout(temporizadorImpresion);
    }

    try {
      const ventana = iframe.contentWindow;
      if (ventana) {
        ventana.addEventListener("afterprint", limpiar);
        iframe.focus();
        ventana.focus();
        // window.print() del documento temporal, no de la página completa.
        ventana.window.print();
      } else {
        window.print();
        limpiar();
      }
    } catch {
      // Algunos navegadores bloquean la impresión automática: no propagamos el error.
      limpiar();
    }
  };

  iframe.onload = imprimir;
  window.addEventListener("afterprint", limpiar);
  document.body.appendChild(iframe);

  temporizadorImpresion = window.setTimeout(imprimir, 800);
  temporizadorLimpieza = window.setTimeout(limpiar, 60000);

  try {
    iframe.srcdoc = html;
  } catch {
    limpiar();
  }
};
