import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, KeyRound, Lock } from "lucide-react";
import { useLicense } from "../../hooks/useLicense";
import { LICENSE_BLOCK_DAYS } from "../../constants/license";

/**
 * Pantalla final de la licencia. El acceso se bloquea al terminar la gracia,
 * pero se permite aplicar aquí la actualización entregada por el proveedor
 * para que la clínica pueda regularizar sin salir de la aplicación.
 */
export const LicenseBlockedScreen = () => {
  const { applyLicenseCode } = useLicense();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resultado = applyLicenseCode(code);
    if (!resultado.ok) {
      setError(resultado.error ?? "No se pudo aplicar el código.");
      setFeedback("");
      return;
    }
    setError("");
    setFeedback(
      resultado.meses === 0
        ? "La licencia ya estaba al día con esa fecha."
        : `Licencia regularizada por ${resultado.meses} mes(es). Puedes volver a entrar.`,
    );
    setCode("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Acceso bloqueado
            </h1>
            <p className="text-sm text-slate-400">
              La prueba y el período de gracia terminaron.
            </p>
          </div>
        </div>

        <p className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm leading-relaxed text-slate-300">
          A partir del día {LICENSE_BLOCK_DAYS + 1} (transcurridos{" "}
          {LICENSE_BLOCK_DAYS} días), la aplicación deja de estar disponible.
          Para seguir usando VetCare+ necesitas una actualización de licencia
          entregada por el proveedor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="blocked-code"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Código de actualización
            </label>
            <input
              id="blocked-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
                setFeedback("");
              }}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="VETEXT-... o VETPAGO-..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-sm text-white outline-none transition-colors placeholder:font-sans placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {feedback && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {feedback}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ece883] px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
          >
            <KeyRound className="h-4 w-4" />
            Aplicar código y recuperar el acceso
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          Si no tienes el código, solicítalo al proveedor de VetCare+. Si eres
          el proveedor,{" "}
          <Link to="/login" className="font-bold text-[#ece883] hover:underline">
            inicia sesión aquí
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
