import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { useLicense } from "../../hooks/useLicense";
import { READ_ONLY_WRITE_EVENT } from "../../utils/licenseGuard";

export const LicenseStatusBanner = () => {
  const {
    bypass,
    license,
    diasRestantes,
    diasGraciaRestantes,
    diasDeGracia,
    suscripcionVigente,
    enGracia,
    isBloqueado,
    isReadOnly,
  } = useLicense();
  const [intentoBloqueado, setIntentoBloqueado] = useState(false);

  useEffect(() => {
    let temporizador: number | undefined;
    const avisar = () => {
      setIntentoBloqueado(true);
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => setIntentoBloqueado(false), 4000);
    };
    window.addEventListener(READ_ONLY_WRITE_EVENT, avisar);
    return () => {
      window.removeEventListener(READ_ONLY_WRITE_EVENT, avisar);
      window.clearTimeout(temporizador);
    };
  }, []);

  let contenido = null;

  if (!bypass && license && !suscripcionVigente) {
    if (isBloqueado) {
      contenido = (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Acceso bloqueado</p>
            <p className="text-xs opacity-80">
              El período de gracia terminó. Regulariza la suscripción para volver
              a usar la aplicación.
            </p>
          </div>
        </div>
      );
    } else if (isReadOnly && enGracia) {
      contenido = (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-orange-400/40 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">
              Período de gracia · quedan {diasGraciaRestantes}{" "}
              {diasGraciaRestantes === 1 ? "día" : "días"}
            </p>
            <p className="text-xs opacity-80">
              Puedes consultar la información, pero ya no es posible registrar
              cambios. Al terminar la gracia el acceso se bloqueará.
            </p>
          </div>
        </div>
      );
    } else {
      contenido = (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">
              Período de prueba · quedan {diasRestantes}{" "}
              {diasRestantes === 1 ? "día" : "días"}
            </p>
            <p className="flex items-center gap-1.5 text-xs opacity-80">
              <Clock className="h-3 w-3" />
              Al terminar la prueba hay {diasDeGracia} días de gracia en modo
              lectura.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {intentoBloqueado && (
        <div className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          La licencia está en modo lectura. Los cambios no se guardaron;
          regulariza la suscripción para volver a editar.
        </div>
      )}
      {contenido}
    </>
  );
};
