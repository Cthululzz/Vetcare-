// src/components/schedule/appointmentUtils.tsx
import { Dog, Cat, Star } from "lucide-react";

export const formatDateLatam = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const parseTimeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  let cleanStr = timeStr.trim().toUpperCase();
  let isPM = cleanStr.includes("PM");
  let isAM = cleanStr.includes("AM");

  cleanStr = cleanStr.replace("AM", "").replace("PM", "").trim();
  const parts = cleanStr.split(":");
  if (parts.length < 2) return 0;

  let hours = parseInt(parts[0], 10) || 0;
  let minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export const sortCitasByHour = (list: any[]) => {
  return [...list].sort((a, b) => {
    const minA = parseTimeToMinutes(a.hora);
    const minB = parseTimeToMinutes(b.hora);
    return minA - minB;
  });
};

export const getBadgeStyle = (tipo: string) => {
  switch (tipo?.toLowerCase()) {
    case "urgencia":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    case "vacuna":
    case "vacunación":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "desparasitación":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "esterilización":
    case "esterilización / cirugía":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    default:
      return "bg-[var(--accent-bg)] text-[var(--accent)] border-[var(--accent-border)]";
  }
};

export const getCardGlowConfig = (tipo: string) => {
  let colorGlow = "rgba(100, 116, 139, 0.15)"; // Slate por defecto

  switch (tipo?.toLowerCase()) {
    case "urgencia":
      colorGlow = "rgba(239, 68, 68, 0.22)";
      break;
    case "vacuna":
    case "vacunación":
      colorGlow = "rgba(16, 185, 129, 0.22)";
      break;
    case "desparasitación":
      colorGlow = "rgba(168, 85, 247, 0.22)";
      break;
    case "esterilización":
    case "esterilización / cirugía":
      colorGlow = "rgba(59, 130, 246, 0.22)";
      break;
    default:
      colorGlow = "rgba(100, 116, 139, 0.22)";
      break;
  }

  return {
    borderStyle:
      "border-slate-800 hover:border-slate-700 shadow-lg shadow-black/30",
    glowStyle: {
      backgroundImage: `radial-gradient(circle at 100% 100%, ${colorGlow} 0%, transparent 65%)`,
    },
  };
};

export const getPetIcon = (tipoMascota: string, genero?: string) => {
  const isMacho = genero === "Macho";
  const isHembra = genero === "Hembra";

  // Color de los trazos (líneas) del icono según el género
  const iconColorStyles = isMacho
    ? "text-blue-400"
    : isHembra
      ? "text-pink-400"
      : "text-slate-400";

  const sizeClass = `w-5 h-5 ${iconColorStyles}`;
  const t = tipoMascota?.toLowerCase() || "";

  if (t.includes("gato") || t.includes("felino")) {
    return <Cat className={sizeClass} />;
  } else if (
    t.includes("exótico") ||
    t.includes("exotico") ||
    t.includes("ave") ||
    t.includes("pajaro") ||
    t.includes("loro") ||
    t.includes("conejo") ||
    t.includes("conejillo") ||
    t.includes("hamster") ||
    t.includes("cuy") ||
    t.includes("otro")
  ) {
    // Agrupamos exóticos, aves, conejos y otros bajo el mismo icono
    return <Star className={sizeClass} />;
  } else {
    // Por defecto se queda con perro
    return <Dog className={sizeClass} />;
  }
};
