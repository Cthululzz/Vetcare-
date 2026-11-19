import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** Cantidad total de elementos después de aplicar filtros. */
  total: number;
  /** Página actual, empezando en 1. */
  page: number;
  /** Elementos mostrados por página. */
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Sustantivo usado en el resumen, por ejemplo "recetas" o "pacientes". */
  label?: string;
}

type PaginaItem = number | "elipsis";

/** Números de página a mostrar, con elipsis para rangos largos. */
function obtenerPaginas(actual: number, total: number): PaginaItem[] {
  const visibles = new Set<number>([1, total, actual - 1, actual, actual + 1]);
  const numeros = [...visibles]
    .filter((numero) => numero >= 1 && numero <= total)
    .sort((a, b) => a - b);

  const items: PaginaItem[] = [];
  numeros.forEach((numero, indice) => {
    if (indice > 0 && numero - numeros[indice - 1] > 1) {
      items.push("elipsis");
    }
    items.push(numero);
  });
  return items;
}

export const Pagination = ({
  total,
  page,
  pageSize,
  onPageChange,
  label = "registros",
}: PaginationProps) => {
  if (total <= pageSize) return null;

  const totalPaginas = Math.ceil(total / pageSize);
  const actual = Math.min(Math.max(page, 1), totalPaginas);
  const desde = (actual - 1) * pageSize + 1;
  const hasta = Math.min(actual * pageSize, total);

  return (
    <nav
      aria-label="Paginación de resultados"
      className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-slate-400">
        Mostrando <span className="font-semibold text-slate-200">{desde}</span>–
        <span className="font-semibold text-slate-200">{hasta}</span> de{" "}
        <span className="font-semibold text-slate-200">{total}</span> {label}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(actual - 1)}
          disabled={actual === 1}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Anterior
        </button>

        {obtenerPaginas(actual, totalPaginas).map((item, indice) =>
          item === "elipsis" ? (
            <span
              key={`elipsis-${indice}`}
              aria-hidden="true"
              className="px-1.5 text-xs text-slate-500"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-label={`Ir a la página ${item}`}
              aria-current={item === actual ? "page" : undefined}
              className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition-colors cursor-pointer ${
                item === actual
                  ? "border-[#ece883]/40 bg-[#ece883]/15 text-[#ece883]"
                  : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(actual + 1)}
          disabled={actual === totalPaginas}
          aria-label="Página siguiente"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          Siguiente
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
};
