import { X, AlertTriangle, Pencil, History } from "lucide-react";
import type { Patient, Owner } from "../../../types/patient";
import { usePatients } from "../../../hooks/usePatients";
import PatientProfileHeader from "./PatientProfileHeader";
import PatientConditionsCard from "./PatientConditionsCard";
import PatientOwnerInfo from "./PatientOwnerInfo";
import PatientClinicalHistory from "./PatientClinicalHistory";

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  owner: Owner | null;
  onDeleteMedicalRecord?: (patientId: string, recordId: string) => void;
  onDeletePatient?: (patientId: string) => void;
  onEditPatient?: (patient: Patient) => void;
  onOpenClinicalHistory?: (patient: Patient) => void;
}

export const PatientProfileModal = ({
  isOpen,
  onClose,
  patient,
  owner,
  onDeleteMedicalRecord,
  onDeletePatient,
  onEditPatient,
  onOpenClinicalHistory,
}: PatientProfileModalProps) => {
  const { updateConditions } = usePatients();

  if (!isOpen || !patient) return null;

  const handleSaveConditions = (newConditions: string) => {
    updateConditions(patient.id, newConditions);
  };

  const handleFullPatientDelete = () => {
    if (
      window.confirm(
        `¿Estás absolutamente seguro de eliminar la ficha completa de "${patient.name}"? Esta acción no se puede deshacer y borrará todo su historial clínico.`,
      )
    ) {
      if (onDeletePatient) {
        onDeletePatient(patient.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8 space-y-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#ece883]/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Cabecera */}
        <PatientProfileHeader patient={patient} />

        {/* 2. Condiciones Previas / Alergias */}
        <PatientConditionsCard
          key={`${patient.id}-${patient.conditions ?? ""}`}
          conditions={patient.conditions}
          onSave={handleSaveConditions}
        />

        {/* 3. Datos del Propietario */}
        <PatientOwnerInfo owner={owner} />

        {/* 4. Historial Clínico */}
        <PatientClinicalHistory
          history={patient.history}
          onDeleteMedicalRecord={
            onDeleteMedicalRecord
              ? (recordId) => onDeleteMedicalRecord(patient.id, recordId)
              : undefined
          }
          onOpenFullHistory={
            onOpenClinicalHistory
              ? () => onOpenClinicalHistory(patient)
              : undefined
          }
        />

        {/* PIE DEL MODAL */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenClinicalHistory && (
              <button
                type="button"
                onClick={() => onOpenClinicalHistory(patient)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ece883]/10 hover:bg-[#ece883]/20 border border-[#ece883]/30 text-[#ece883] text-xs font-bold transition-colors cursor-pointer"
                title="Ver el historial clínico completo"
              >
                <History className="w-4 h-4" />
                <span>Historial clínico</span>
              </button>
            )}

            {onDeletePatient && (
              <button
                type="button"
                onClick={handleFullPatientDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-colors cursor-pointer"
                title="Eliminar paciente y su expediente completo"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Eliminar ficha completa</span>
              </button>
            )}

            {onEditPatient && (
              <button
                type="button"
                onClick={() => onEditPatient(patient)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                title="Editar datos del paciente y su propietario"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar ficha</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar ficha
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientProfileModal;
