import { Heart, Phone, Mail } from "lucide-react";
import type { Owner } from "../../../types/patient";

interface PatientOwnerInfoProps {
  owner: Owner | null;
}

export const PatientOwnerInfo = ({ owner }: PatientOwnerInfoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Heart className="w-5 h-5 text-red-500 fill-red-500/20" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Propietario</p>
          <p className="text-sm font-bold text-white">
            {owner?.name || "No registrado"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
          <Phone className="w-5 h-5 text-[#ece883]" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">
            Teléfono de Contacto
          </p>
          <p className="text-sm font-bold text-white">
            {owner?.phone || "No registrado"}
          </p>
        </div>
      </div>
      {owner?.email && (
        <div className="flex items-center gap-3 md:col-span-2">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Correo Electrónico
            </p>
            <p className="text-sm font-bold text-white">{owner.email}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientOwnerInfo;
