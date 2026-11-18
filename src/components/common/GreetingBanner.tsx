import { useState, useEffect } from "react";
import { PawPrint } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const frasesManana = [
  "Todo está listo para comenzar una nueva jornada.",
  "Esperamos que tengas un excelente inicio de día.",
  "Hoy es una nueva oportunidad para brindar una atención de calidad.",
  "Que tu jornada esté llena de buenas decisiones y grandes resultados.",
  "Gracias por comenzar el día junto a VetCare+.",
  "Cada paciente que atiendas hoy merece lo mejor de ti.",
];

const frasesTarde = [
  "Esperamos que tu jornada continúe de la mejor manera.",
  "Gracias por seguir cuidando de tus pacientes.",
  "Cada consulta aporta al bienestar de quienes más lo necesitan.",
  "La información correcta facilita mejores decisiones clínicas.",
  "Tu dedicación marca la diferencia en cada atención.",
  "VetCare+ continúa acompañándote durante la jornada.",
];

const frasesNoche = [
  "Gracias por tu compromiso, incluso al finalizar el día.",
  "Las urgencias no esperan; nosotros tampoco.",
  "VetCare+ sigue aquí para acompañarte cuando más lo necesitas.",
  "Esperamos que el resto de tu jornada transcurra con tranquilidad.",
  "Gracias por dedicar tu tiempo al cuidado de tus pacientes.",
  "Cada esfuerzo realizado hoy contribuye al bienestar animal.",
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const GreetingBanner = () => {
  const { user } = useAuth();
  const [saludo, setSaludo] = useState("");
  const [fraseDelDia, setFraseDelDia] = useState("");

  useEffect(() => {
    const hora = new Date().getHours();
    let listaSeleccionada = frasesManana;

    if (hora >= 6 && hora < 12) {
      setSaludo("Buenos días");
      listaSeleccionada = frasesManana;
    } else if (hora >= 12 && hora < 19) {
      setSaludo("Buenas tardes");
      listaSeleccionada = frasesTarde;
    } else {
      setSaludo("Buenas noches");
      listaSeleccionada = frasesNoche;
    }

    const fraseAleatoria =
      listaSeleccionada[Math.floor(Math.random() * listaSeleccionada.length)];
    setFraseDelDia(fraseAleatoria);
  }, []);

  // Obtener nombre del usuario logueado, o usar placeholder si no hay
  const nombreUsuario = user?.name || "Usuario";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 space-y-1">
        <p className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
          Inicio
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <PawPrint className="w-8 h-8 text-[#ece883] shrink-0" />
          {saludo}, {nombreUsuario}.
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          {fraseDelDia || "Todo está listo para comenzar una nueva jornada."}
        </p>
      </div>
    </div>
  );
};

export default GreetingBanner;
