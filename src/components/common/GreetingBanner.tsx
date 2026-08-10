// src/components/GreetingBanner.tsx
import { useState, useEffect } from "react";

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

interface GreetingBannerProps {
  nombreDoctor: string;
}

export const GreetingBanner = ({ nombreDoctor }: GreetingBannerProps) => {
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        {saludo}, {nombreDoctor}.
      </h1>
      <p className="text-slate-400 mt-1 text-sm sm:text-base">
        {fraseDelDia || "Todo está listo para comenzar una nueva jornada."}
      </p>
    </div>
  );
};

export default GreetingBanner;
