import { useState, type FormEvent } from "react";
import { AlertCircle, KeyRound, ShieldCheck } from "lucide-react";
import { useLicense } from "../../hooks/useLicense";
import { TRIAL_DAYS } from "../../constants/license";

export const ActivationScreen = () => {
  const { activate } = useLicense();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activate(code)) {
      setError(
        "El código no es válido. Revisa el código de instalación entregado con la aplicación.",
      );
      return;
    }
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl border border-[#ece883]/20 bg-[#ece883]/10 p-3 text-[#ece883]">
            <KeyRound className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Activación de VetCare+
            </h1>
            <p className="text-sm text-slate-400">
              Ingresa el código de instalación de la clínica.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="activation-code"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Código de instalación
            </label>
            <input
              id="activation-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="VET-PILOTO-2026-XXXX"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-base font-bold tracking-widest text-white outline-none transition-colors placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-600 focus:border-[#ece883]"
            />
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ece883] px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-[#e4df68] cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Activar prueba de {TRIAL_DAYS} días
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          La prueba comienza el día de la activación y puede ser ajustada por el
          administrador.
        </p>
      </div>
    </div>
  );
};
