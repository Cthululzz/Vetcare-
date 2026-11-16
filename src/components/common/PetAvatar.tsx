import { Cat, Dog, Star } from "lucide-react";
import type { EspecieMascota, Genero } from "../../constants/appConstants";

// ============================================
// AVATAR DE MASCOTA
// ============================================
// Representación visual normalizada de la especie y el sexo del paciente:
// - Perro: Dog · Gato: Cat · Exótico: Star
// - Hembra: rosa · Macho: azul
// Se reutiliza en pacientes, agenda y hospitalización para que la lectura
// sea idéntica en toda la app.

export type PetAvatarSize = "xs" | "sm" | "md" | "lg";

interface PetAvatarProps {
  species: EspecieMascota | string;
  gender?: Genero | string;
  size?: PetAvatarSize;
  /** Raza a mostrar debajo del ícono. */
  breed?: string;
  /** Muestra la raza debajo del ícono (por defecto, si se envía `breed`). */
  showBreed?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<PetAvatarSize, { box: string; icon: string }> = {
  xs: { box: "p-1.5 rounded-lg", icon: "w-4 h-4" },
  sm: { box: "p-2 rounded-xl", icon: "w-5 h-5" },
  md: { box: "p-3 rounded-2xl", icon: "w-7 h-7" },
  lg: { box: "p-4 rounded-2xl", icon: "w-8 h-8" },
};

export const PetAvatar = ({
  species,
  gender,
  size = "md",
  breed,
  showBreed = Boolean(breed),
  className = "",
}: PetAvatarProps) => {
  const isFemale = gender === "hembra";
  const iconColorClass = isFemale ? "text-pink-400" : "text-blue-400";
  const boxColorClass = isFemale
    ? "bg-pink-500/10 border-pink-500/20"
    : "bg-blue-500/10 border-blue-500/20";

  const Icon = species === "gato" ? Cat : species === "exoticos" ? Star : Dog;
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex flex-col items-center gap-1.5 shrink-0 ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center border shadow-inner ${sizeClasses.box} ${boxColorClass}`}
      >
        <Icon className={`${sizeClasses.icon} ${iconColorClass}`} />
      </span>

      {showBreed && (
        <span
          className="block text-[10px] font-semibold text-slate-400 text-center leading-tight max-w-[96px] truncate"
          title={breed || "Sin raza registrada"}
        >
          {breed || "Sin raza"}
        </span>
      )}
    </span>
  );
};

export default PetAvatar;
