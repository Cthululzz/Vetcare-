import { Users, Plus } from "lucide-react";
import { PageBanner } from "../common/PageBanner";

interface PatientsHeaderProps {
  onNewRecord: () => void;
  canCreate?: boolean;
  isReadOnly?: boolean;
}

export const PatientHeader = ({
  onNewRecord,
  canCreate = true,
  isReadOnly = false,
}: PatientsHeaderProps) => {
  return (
    <PageBanner
      icon={Users}
      title="Gestión de Pacientes"
      description="Busca, consulta y administra pacientes y propietarios de la clínica."
      actions={
        canCreate ? (
          <button
            onClick={onNewRecord}
            disabled={isReadOnly}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ece883] text-slate-950 font-bold text-sm hover:bg-[#e4df68] transition-all shadow-md shadow-[#ece883]/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Nuevo Registro
          </button>
        ) : undefined
      }
    />
  );
};
