// src/components/Footer.tsx
import { HeartPulse } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-auto py-6 px-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <HeartPulse className="w-4 h-4 text-[#ece883]" />
        <span className="text-slate-400 font-medium">
          "Menos tiempo buscando información, más tiempo cuidando pacientes."
        </span>
      </div>
      <div>
        <span>
          VetCare+ &copy; {new Date().getFullYear()} — Gestión Veterinaria
        </span>
      </div>
    </footer>
  );
};

export default Footer;
