import {
  Activity,
  BedDouble,
  Bug,
  FileText,
  FlaskConical,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import type { MedicalRecordType } from "../../../types/patient";

export interface RecordTypeMeta {
  label: string;
  icon: LucideIcon;
  /** Clases del badge (texto + fondo + borde). */
  badgeClass: string;
  /** Clase del punto/icono para la línea de tiempo. */
  accentClass: string;
}

export const RECORD_TYPE_META: Record<MedicalRecordType, RecordTypeMeta> = {
  consulta: {
    label: "Consulta",
    icon: Stethoscope,
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    accentClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  vacunacion: {
    label: "Vacunación",
    icon: Syringe,
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  desparasitacion: {
    label: "Desparasitación",
    icon: Bug,
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    accentClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  examen: {
    label: "Examen",
    icon: FlaskConical,
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    accentClass: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  procedimiento: {
    label: "Procedimiento",
    icon: Activity,
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    accentClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  hospitalizacion: {
    label: "Hospitalización",
    icon: BedDouble,
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    accentClass: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  nota: {
    label: "Nota clínica",
    icon: FileText,
    badgeClass: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    accentClass: "text-slate-300 bg-slate-500/10 border-slate-500/20",
  },
};
