import {
  Droplets,
  FlaskConical,
  Microscope,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import type { ExamCategoryId } from "../types/examOrder";

export interface ExamenCategoriaOpcion {
  id: ExamCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const EXAMEN_CATEGORIAS: ExamenCategoriaOpcion[] = [
  {
    id: "sangre",
    label: "Exámenes de sangre",
    description: "Hemograma, perfil bioquímico, coagulación y serologías.",
    icon: Droplets,
  },
  {
    id: "orina_heces_muestras",
    label: "Orina / heces / muestras corporales",
    description: "Urianálisis, coprológico, citología y cultivos.",
    icon: FlaskConical,
  },
  {
    id: "imagenes",
    label: "Imágenes",
    description: "Radiografía, ecografía, tomografía o resonancia.",
    icon: ScanLine,
  },
  {
    id: "infecciosas_hormonas",
    label: "Enfermedades infecciosas / hormonas",
    description: "Tests infecciosos y determinaciones hormonales.",
    icon: Microscope,
  },
];

export const getExamenCategoriaLabel = (id: ExamCategoryId): string =>
  EXAMEN_CATEGORIAS.find((opcion) => opcion.id === id)?.label ?? id;
