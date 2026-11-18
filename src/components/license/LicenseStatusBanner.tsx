import { AlertTriangle, Clock, Lock } from "lucide-react";
import { useLicense } from "../../hooks/useLicense";

export const LicenseStatusBanner = () => {
  const { bypass, license, diasRestantes, suscripcionVigente, isReadOnly } =
    useLicense();

  if (bypass || !license || suscripcionVigente) return null;

  if (isReadOnly) {
    return (
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">Modo lectura</p>
          <p className="text-xs opacity-80">
            El período de prueba terminó. Puedes consultar la información, pero
            ya no es posible registrar cambios hasta regularizar la suscripción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">
        <p className="font-bold">
          Período de prueba · quedan {diasRestantes}{" "}
          {diasRestantes === 1 ? "día" : "días"}
        </p>
        <p className="flex items-center gap-1.5 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          Al terminar la prueba la aplicación pasa a modo lectura.
        </p>
      </div>
    </div>
  );
};
