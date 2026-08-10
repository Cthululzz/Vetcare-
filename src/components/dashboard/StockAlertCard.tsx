import { PackageX, ChevronRight } from "lucide-react";

interface AlertaStock {
  medicamento: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
}

interface StockAlertCardProps {
  alerta: AlertaStock;
  onNavigate: (path: string) => void;
}

export const StockAlertCard = ({ alerta, onNavigate }: StockAlertCardProps) => {
  return (
    <div
      onClick={() => onNavigate("/inventario")}
      className="relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-7 transition-all cursor-pointer group shadow-sm flex flex-col justify-between min-h-[240px]"
    >
      <div className="pointer-events-none absolute w-[300px] h-[300px] bg-red-500/10 blur-[100px] rounded-full -bottom-16 -right-16 group-hover:bg-red-500/20 transition-all" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <PackageX className="w-5 h-5 text-[#ece883]" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Alerta de Stock
            </h3>
          </div>
          <span className="bg-amber-500/10 text-[#ece883] border border-amber-500/20 text-xs px-3 py-1 rounded-lg font-medium">
            Urgente
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-5 my-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ece883] transition-colors">
                {alerta.medicamento}
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Mínimo requerido:{" "}
                <span className="text-slate-300 font-medium">
                  {alerta.stockMinimo} {alerta.unidad}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-red-400">
                {alerta.stockActual}
              </span>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider">
                en stock
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs sm:text-sm text-slate-400">
            <span>
              Estado actual:{" "}
              <strong className="text-red-400">
                Stock crítico / Reposición necesaria inmediata
              </strong>
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs sm:text-sm font-medium text-[#ece883] group-hover:underline">
        <span>Gestionar Inventario y Farmacia</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};
