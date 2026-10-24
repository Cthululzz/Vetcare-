import { useState, useEffect, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // ============================================
  // ESTADOS
  // ============================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // EFECTOS
  // ============================================

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simular delay de red (en producción sería una llamada real al backend)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = login(email, password);

    if (!result.success) {
      setError(result.error || "Error desconocido");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    navigate("/", { replace: true });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Glow Original (Amarillo/Cálido) */}
        <div className="pointer-events-none absolute w-[600px] h-[600px] bg-[#ece883]/10 blur-[150px] animate-pulse rounded-full top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2" />

        {/* Glow Purpura Oscuro */}
        <div className="pointer-events-none absolute w-[500px] h-[500px] bg-purple-600/15 blur-[160px] rounded-full bottom-[-10%] right-[-10%]" />

        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 relative z-10">
          <div>
            <div className="inline-flex items-center rounded-full bg-[#ece883]/10 border border-[#ece883]/20 px-3 py-1 text-sm text-[#ece883] mb-4">
              Plataforma Veterinaria
            </div>

            <h1 className="text-4xl font-bold text-white select-none">
              Vet<span className="text-[#ece883]">Care+</span>
            </h1>

            <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-md">
              La plataforma para clínicas veterinarias modernas.
            </p>

            <p className="mt-3 text-slate-500">
              Gestiona pacientes, citas e historiales clínicos desde un solo
              lugar.
            </p>

            <div className="mt-8 space-y-4 text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ece883]" />
                Agenda y turnos en tiempo real
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ece883]" />
                Historial clínico y evolución
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ece883]" />
                Control de pacientes y tutores
              </div>

              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ece883]" />
                Gestión de stock y farmacia
              </div>
            </div>

            {/* Credenciales de prueba */}
            <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Credenciales de prueba
              </p>
              <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                <p>
                  <span className="text-slate-500">Admin:</span>{" "}
                  admin@vetcare.com / admin123
                </p>
                <p>
                  <span className="text-slate-500">Veterinario:</span>{" "}
                  vet@vetcare.com / vet123
                </p>
                <p>
                  <span className="text-slate-500">Recepción:</span>{" "}
                  recepcion@vetcare.com / recep123
                </p>
              </div>
            </div>

            {/* Versión del sistema */}
            <div className="mt-4 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs text-slate-400 font-mono tracking-wider">
              VetCare+ System v1.0
            </div>
          </div>

          <div className="flex justify-center items-center mt-6">
            <img
              src={logo}
              alt="VetCare+"
              className="w-[300px] object-contain select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="bg-slate-900/70 backdrop-blur-xl border-l border-white/10 p-10 lg:p-14 flex flex-col justify-center relative z-10">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-white">Bienvenido</h2>

            <p className="mt-2 text-slate-400">
              Accede a tu plataforma veterinaria.
            </p>

            {/* Mensaje de error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="correo@ejemplo.com"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800/70
                      text-white
                      placeholder:text-slate-500
                      pl-12
                      pr-4
                      py-3
                      outline-none
                      transition
                      focus:border-[#ece883]
                      focus:ring-4
                      focus:ring-[#ece883]/20
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-700
                      bg-slate-800/70
                      text-white
                      placeholder:text-slate-500
                      pl-12
                      pr-12
                      py-3
                      outline-none
                      transition
                      focus:border-[#ece883]
                      focus:ring-4
                      focus:ring-[#ece883]/20
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                    "
                  />

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 group">
                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="text-slate-500 hover:text-slate-300 transition disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>

                    <div className="absolute right-0 -top-11 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs shadow-lg whitespace-nowrap opacity-0 pointer-events-none transition-all duration-200 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0">
                      {showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  disabled={isLoading}
                  className="text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="
                  w-full
                  bg-[#ece883]
                  text-slate-900
                  font-semibold
                  tracking-wide
                  py-3.5
                  rounded-xl
                  transition
                  hover:bg-[#e4df6a]
                  hover:shadow-lg
                  hover:shadow-[#ece883]/20
                  active:scale-[0.99]
                  cursor-pointer
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  disabled:hover:bg-[#ece883]
                  disabled:hover:shadow-none
                  disabled:active:scale-100
                "
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
