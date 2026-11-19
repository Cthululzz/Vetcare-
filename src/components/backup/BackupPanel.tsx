import { AlertCircle, CheckCircle2, Database, Download, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { storageStore } from "../../hooks/useLocalStorage";
import { canWriteStorageKey } from "../../utils/licenseGuard";

interface RespaldoLeido {
  version: unknown;
  exportedAt?: string;
  data: Record<string, unknown>;
  claves: string[];
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null && !Array.isArray(valor);

export const BackupPanel = () => {
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [respaldo, setRespaldo] = useState<RespaldoLeido | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const ocupado = exportando || importando;

  const handleExportar = (): void => {
    setExportando(true);
    setError("");
    setFeedback("");

    try {
      const datos: Record<string, unknown> = {};
      const claves = Object.keys(localStorage).filter((clave) =>
        clave.startsWith("vet_"),
      );

      claves.forEach((clave) => {
        const crudo = localStorage.getItem(clave) ?? "";
        try {
          datos[clave] = JSON.parse(crudo) as unknown;
        } catch {
          datos[clave] = crudo;
        }
      });

      const contenido = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: datos,
      };
      const blob = new Blob([JSON.stringify(contenido, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `vetcare_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setFeedback(
        `Respaldo exportado correctamente: ${claves.length} clave${claves.length === 1 ? "" : "s"}.`,
      );
    } catch {
      setError("No se pudo generar el respaldo. Inténtalo nuevamente.");
    } finally {
      setExportando(false);
    }
  };

  const handleArchivo = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    setRespaldo(null);
    setError("");
    setFeedback("");
    if (!archivo) return;

    setImportando(true);
    try {
      const parseado: unknown = JSON.parse(await archivo.text());
      if (!esObjeto(parseado)) {
        throw new Error("El archivo debe contener un objeto JSON.");
      }
      if (!("version" in parseado) || !("data" in parseado)) {
        throw new Error("El respaldo debe incluir los campos version y data.");
      }
      if (!esObjeto(parseado.data)) {
        throw new Error("El campo data debe ser un objeto.");
      }

      const data = parseado.data;
      const claves = Object.keys(data);
      const invalidas = claves.filter((clave) => !clave.startsWith("vet_"));
      if (invalidas.length > 0) {
        const detalle = invalidas.slice(0, 5).join(", ");
        throw new Error(
          `Se rechazó el respaldo: ${invalidas.length} clave${invalidas.length === 1 ? "" : "s"} no válida${invalidas.length === 1 ? "" : "s"} (${detalle}${invalidas.length > 5 ? ", ..." : ""}). Solo se admiten claves vet_.`,
        );
      }

      setRespaldo({
        version: parseado.version,
        exportedAt:
          typeof parseado.exportedAt === "string"
            ? parseado.exportedAt
            : undefined,
        data,
        claves,
      });
      setFeedback(
        `Respaldo válido: ${claves.length} clave${claves.length === 1 ? "" : "s"} encontrada${claves.length === 1 ? "" : "s"}. Revisa el resumen antes de confirmar.`,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo leer el archivo de respaldo.",
      );
    } finally {
      setImportando(false);
    }
  };

  const handleConfirmar = (): void => {
    if (!respaldo || ocupado) return;

    const noEscribibles = respaldo.claves.filter(
      (clave) => !canWriteStorageKey(clave),
    );
    if (noEscribibles.length > 0) {
      setError(
        "La licencia está en modo lectura. Regulariza la suscripción antes de importar datos.",
      );
      return;
    }

    setImportando(true);
    setError("");
    setFeedback("");
    try {
      respaldo.claves.forEach((clave) => {
        storageStore.set(clave, respaldo.data[clave]);
      });
      const cantidad = respaldo.claves.length;
      setRespaldo(null);
      setFeedback(
        `Importación completada: ${cantidad} clave${cantidad === 1 ? "" : "s"}. La página se recargará en unos segundos.`,
      );
      window.setTimeout(() => window.location.reload(), 1000);
    } catch {
      setImportando(false);
      setError("No se pudo completar la importación. Inténtalo nuevamente.");
    }
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex items-start gap-2 border-b border-slate-800 pb-3">
        <Database className="h-4 w-4 mt-0.5 text-[#ece883] shrink-0" />
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
            Respaldos y exportación
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Guarda una copia de los datos locales o restaura un respaldo previo.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">Exportar respaldo</h3>
          <p className="text-xs text-slate-400">
            Se descargará un archivo JSON con todas las claves vet_ guardadas en
            este navegador.
          </p>
          <button
            type="button"
            onClick={handleExportar}
            disabled={ocupado}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ece883] px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportando ? "Exportando..." : "Exportar respaldo"}
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">Importar respaldo</h3>
          <p className="text-xs text-slate-400">
            Selecciona un archivo JSON generado por VetCare+. Primero verás un
            resumen de su contenido.
          </p>
          <input
            type="file"
            accept="application/json"
            onChange={handleArchivo}
            disabled={ocupado}
            aria-label="Archivo de respaldo JSON"
            className="block w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#ece883] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {respaldo && (
            <div className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
              <p className="font-bold">Resumen del respaldo</p>
              <ul className="space-y-1 text-amber-100/90">
                <li>Versión: {String(respaldo.version)}</li>
                <li>Claves encontradas: {respaldo.claves.length}</li>
                {respaldo.exportedAt && (
                  <li>Fecha de exportación: {respaldo.exportedAt}</li>
                )}
              </ul>

              {respaldo.claves.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded-lg bg-slate-950/70 p-2 font-mono text-[11px] text-slate-300">
                  {respaldo.claves.map((clave) => (
                    <div key={clave}>{clave}</div>
                  ))}
                </div>
              )}

              <p className="flex items-start gap-2 font-semibold text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Advertencia: esta acción reemplaza los datos actuales de las
                claves incluidas. No se puede deshacer.
              </p>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRespaldo(null);
                    setError("");
                    setFeedback("");
                  }}
                  disabled={ocupado}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 transition-colors hover:border-slate-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={ocupado}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1.5 font-bold text-white transition-colors hover:bg-red-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {importando ? "Importando..." : "Confirmar importación"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {feedback && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {feedback}
        </p>
      )}
    </section>
  );
};
