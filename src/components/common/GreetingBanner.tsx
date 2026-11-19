import { useMemo } from "react";
import { PawPrint } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PageBanner } from "./PageBanner";

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

const saludoDelMomento = () => {
  const hora = new Date().getHours();
  if (hora >= 6 && hora < 12) {
    return { saludo: "Buenos días", frases: frasesManana };
  }
  if (hora >= 12 && hora < 19) {
    return { saludo: "Buenas tardes", frases: frasesTarde };
  }
  return { saludo: "Buenas noches", frases: frasesNoche };
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const GreetingBanner = () => {
  const { user } = useAuth();
  const mensaje = useMemo(() => {
    const { saludo, frases } = saludoDelMomento();
    const indice = new Date().getDate() % frases.length;
    return { saludo, frase: frases[indice] };
  }, []);

  // Obtener nombre del usuario logueado, o usar placeholder si no hay
  const nombreUsuario = user?.name || "Usuario";

  return (
    <PageBanner
      icon={PawPrint}
      title={`${mensaje.saludo}, ${nombreUsuario}.`}
      description={mensaje.frase}
    />
  );
};

export default GreetingBanner;
