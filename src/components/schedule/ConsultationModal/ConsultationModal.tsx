import { useState, useEffect, useMemo } from "react";
import { Save, CheckCircle2, BedDouble } from "lucide-react";
import {
  getAppointmentBadgeStyle,
  getPetIcon,
  formatAppointmentTypeLabel,
} from "../../../utils/formatters";
import {
  calculateAge,
  parseAgeToBirthDate,
  formatDateLatam,
} from "../../../utils/dateUtils";
import { useAppointments } from "../../../hooks/useAppointments";
import { usePatients } from "../../../hooks/usePatients";
import { ConsultationHeader } from "./ConsultationHeader";
import { ActionConfirmModal } from "./ConsultationModals";
import type { Appointment } from "../../../types/appointment";
import type { Patient, Owner } from "../../../types/patient";
import { getSucursalName } from "../../../constants/appConstants";

// ============================================
// TIPOS
// ============================================
export interface ConsultationData {
  patient: Patient;
  owner: Owner;
  appointment: Appointment;
  notes: string;
  weight?: number;
  recommendations?: string;
  shouldFinish: boolean;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  patient: Patient;
  owner: Owner;
  onSaveConsultation: (data: ConsultationData) => void;
  onHospitalize?: (data: ConsultationData) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ConsultationModal = ({
  isOpen,
  onClose,
  appointment,
  patient,
  owner,
  onSaveConsultation,
  onHospitalize,
}: ConsultationModalProps) => {
  const { isFirstTimePatient } = useAppointments();
  const { updatePatient } = usePatients();

  // ============================================
  // ESTADOS DEL FORMULARIO
  // ============================================
  const [formData, setFormData] = useState({
    edad: "",
    peso: "",
    condicionesPrevias: "",
    recomendaciones: "",
    notas: "",
  });

  // Edad inicial para detectar si el usuario la editó
  const [initialAge, setInitialAge] = useState("");

  const [isHospitalizing, setIsHospitalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // ============================================
  // DATOS DERIVADOS
  // ============================================
  const isFirstTime = useMemo(
    () => isFirstTimePatient(patient.id),
    [isFirstTimePatient, patient.id],
  );

  const showCondicionesPrevias = isFirstTime || Boolean(patient.conditions);

  const badgeStyle = getAppointmentBadgeStyle(appointment.tipo);
  const tipoLabel = formatAppointmentTypeLabel(appointment.tipo);
  const sucursalName = getSucursalName(appointment.sucursalId);

  // Vista previa del nacimiento calculado desde la edad ingresada
  const previewBirthDate = useMemo(
    () => parseAgeToBirthDate(formData.edad),
    [formData.edad],
  );

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    if (isOpen && appointment && patient) {
      const edadInicial =
        patient.age ||
        (patient.birthDate ? calculateAge(patient.birthDate) : "");
      setFormData({
        edad: edadInicial,
        peso:
          appointment.pesoActual !== undefined &&
          appointment.pesoActual !== null
            ? String(appointment.pesoActual)
            : "",
        condicionesPrevias:
          patient.conditions ||
          appointment.condicionesPrevias ||
          appointment.alergiasNotas ||
          "",
        recomendaciones: appointment.recomendaciones || "",
        notas: appointment.notas || "",
      });
      setInitialAge(edadInicial);
      setIsHospitalizing(false);
      setShowConfirmModal(false);
      setHasUnsavedChanges(false);
      setShowExitConfirmModal(false);
    }
  }, [isOpen, appointment, patient]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const saveConditionsIfChanged = () => {
    if (formData.condicionesPrevias !== (patient.conditions || "")) {
      updatePatient(patient.id, { conditions: formData.condicionesPrevias });
    }
  };

  // Guarda la edad y calcula la fecha de nacimiento (mes y año) a partir de ella
  const savePatientDemographics = () => {
    const updates: Partial<Patient> = {};
    const ageChanged = formData.edad !== initialAge;

    if (ageChanged) {
      updates.age = formData.edad;
    }

    // Solo recalcula birthDate si la edad cambió o el paciente no tiene fecha.
    // Así no pisamos una fecha de nacimiento real ya registrada.
    if ((ageChanged || !patient.birthDate) && formData.edad.trim()) {
      const computedBirth = parseAgeToBirthDate(formData.edad);
      if (computedBirth) {
        updates.birthDate = computedBirth;
        updates.birthDateApproximate = true;
      }
    }

    if (Object.keys(updates).length > 0) {
      updatePatient(patient.id, updates);
    }
  };

  const buildConsultationData = (shouldFinish: boolean): ConsultationData => ({
    patient,
    owner,
    appointment,
    notes: formData.notas,
    weight: formData.peso ? parseFloat(formData.peso) : undefined,
    recommendations: formData.recomendaciones,
    shouldFinish,
  });

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();
    saveConditionsIfChanged();
    savePatientDemographics();
    onSaveConsultation(buildConsultationData(false));
    setHasUnsavedChanges(false);
  };

  const handleFinish = () => {
    saveConditionsIfChanged();
    savePatientDemographics();
    onSaveConsultation(buildConsultationData(true));
    setHasUnsavedChanges(false);
  };

  const handleStartHospitalization = () => {
    setIsHospitalizing(true);
    setShowConfirmModal(true);
  };

  const handleConfirmHospitalization = () => {
    setShowConfirmModal(false);
    if (onHospitalize) {
      onHospitalize(buildConsultationData(false));
    }
  };

  const handleSaveAndExit = () => {
    saveConditionsIfChanged();
    savePatientDemographics();
    onSaveConsultation(buildConsultationData(false));
    setShowExitConfirmModal(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen || !appointment || !patient || !owner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-4xl bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          badgeStyle.includes("border-") ? badgeStyle : "border-slate-800"
        }`}
      >
        <ConsultationHeader
          tipoLabel={tipoLabel}
          badgeStyle={badgeStyle}
          onCloseClick={() =>
            hasUnsavedChanges ? setShowExitConfirmModal(true) : onClose()
          }
        />

        <form
          onSubmit={handleSaveOnly}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Info del paciente y dueño */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">{patient.name}</h3>
              {getPetIcon(patient.species, patient.gender)}
            </div>

            <p className="text-xs text-slate-400">
              Propietario:{" "}
              <span className="text-slate-300 font-medium">{owner.name}</span>
              <span className="mx-2">•</span>
              Sucursal:{" "}
              <span className="text-slate-300 font-medium">{sucursalName}</span>
            </p>

            {appointment.motivo && (
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Motivo de la consulta
                </p>
                <p className="text-sm text-slate-200 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/50">
                  "{appointment.motivo}"
                </p>
              </div>
            )}
          </div>

          {/* Edad (calcula nacimiento) | Peso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Edad del Paciente
              </label>
              <input
                type="text"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                placeholder="Ej. 3 años y 2 meses"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              {previewBirthDate && (
                <p className="text-[10px] text-slate-500 mt-1 pl-1">
                  ≈ Nacimiento estimado: {formatDateLatam(previewBirthDate)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Peso actual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="peso"
                value={formData.peso}
                onChange={handleChange}
                placeholder="Ej. 12.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Condiciones previas */}
          {showCondicionesPrevias && (
            <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1">
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                ⚠️ Condiciones Médicas Previas / Alergias (Información Crítica)
              </label>
              <textarea
                name="condicionesPrevias"
                rows={2}
                value={formData.condicionesPrevias}
                onChange={handleChange}
                placeholder="Ej. Alérgico a la penicilina, condición cardíaca leve..."
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          )}

          {/* Notas clínicas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas de la Consulta / Diagnóstico
            </label>
            <textarea
              name="notas"
              rows={3}
              value={formData.notas}
              onChange={handleChange}
              placeholder="Escribe las observaciones..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Recomendaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recomendaciones para el Propietario
            </label>
            <textarea
              name="recomendaciones"
              rows={2}
              value={formData.recomendaciones}
              onChange={handleChange}
              placeholder="Ej. Reposo absoluto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleStartHospitalization}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isHospitalizing
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400 font-bold"
                  : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30"
              }`}
            >
              <BedDouble className="w-4 h-4" /> Hospitalizar
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Guardar
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Finalizar Consulta
              </button>
            </div>
          </div>
        </form>

        <ActionConfirmModal
          show={showConfirmModal}
          title="Hospitalización seleccionada"
          description={`¿Deseas enviar a ${patient.name} al área de internación y monitoreo?`}
          confirmText="Aceptar"
          cancelText="Cancelar"
          onCancel={() => {
            setIsHospitalizing(false);
            setShowConfirmModal(false);
          }}
          onConfirm={handleConfirmHospitalization}
        />

        <ActionConfirmModal
          show={showExitConfirmModal}
          title="Cambios sin guardar"
          description="Tienes modificaciones pendientes que no han sido guardadas. ¿Qué deseas hacer?"
          confirmText="Guardar y salir"
          cancelText="Salir sin guardar"
          borderColor="border-blue-500/40"
          iconBgColor="bg-blue-600/20 border-blue-500/40 text-blue-400"
          onCancel={() => {
            setShowExitConfirmModal(false);
            onClose();
          }}
          onConfirm={handleSaveAndExit}
        />
      </div>
    </div>
  );
};
