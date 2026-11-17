import { useState, useEffect, useMemo, type FormEvent } from "react";
import { Save, CheckCircle2, BedDouble } from "lucide-react";
import {
  getAppointmentBadgeStyle,
  formatAppointmentTypeLabel,
} from "../../../utils/formatters";
import { calculateAge, parseAgeToBirthDate } from "../../../utils/dateUtils";
import { useAppointments } from "../../../hooks/useAppointments";
import { usePatients } from "../../../hooks/usePatients";
import { ConsultationHeader } from "./ConsultationHeader";
import { ActionConfirmModal } from "./ConsultationModals";
import { HospitalizationConfirmModal } from "./HospitalizationConfirmModal";
import { PrescriptionConfirmModal } from "./PrescriptionConfirmModal";
import { PrescriptionFormModal } from "./PrescriptionFormModal";
import { ConsultationForm } from "./ConsultationForm";
import { usePrescriptionFlow } from "./usePrescriptionFlow";
import type { Appointment } from "../../../types/appointment";
import type { Patient, Owner } from "../../../types/patient";
import {
  convertWeight,
  normalizeWeightUnit,
  DEFAULT_WEIGHT_UNIT,
  type WeightUnit,
} from "../../../utils/weight";
import { normalizeVitalSign } from "../../../utils/vitalSigns";
import type {
  ConsultationData,
  HospitalizationFormData,
} from "../../../types/consultation";

// ============================================
// TIPOS EXPORTADOS
// ============================================

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
    weightUnit: DEFAULT_WEIGHT_UNIT,
    condicionesPrevias: "",
    recomendaciones: "",
    diagnostico: "",
    notas: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
  });
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
  const previewBirthDate = useMemo(
    () => parseAgeToBirthDate(formData.edad),
    [formData.edad],
  );

  // ============================================
  // HELPERS DE PERSISTENCIA
  // ============================================
  const saveConditionsIfChanged = () => {
    if (formData.condicionesPrevias !== (patient.conditions || "")) {
      updatePatient(patient.id, { conditions: formData.condicionesPrevias });
    }
  };

  const savePatientDemographics = () => {
    const updates: Partial<Patient> = {};
    const ageChanged = formData.edad !== initialAge;
    if (ageChanged) updates.age = formData.edad;
    if ((ageChanged || !patient.birthDate) && formData.edad.trim()) {
      const computedBirth = parseAgeToBirthDate(formData.edad);
      if (computedBirth) {
        updates.birthDate = computedBirth;
        updates.birthDateApproximate = true;
      }
    }
    if (Object.keys(updates).length > 0) updatePatient(patient.id, updates);
  };

  const buildConsultationData = (
    shouldFinish: boolean,
    hospitalization?: HospitalizationFormData,
  ): ConsultationData => ({
    patient,
    owner,
    appointment,
    notes: formData.notas,
    diagnosis: formData.diagnostico.trim() || undefined,
    temperature: normalizeVitalSign(formData.temperature),
    heartRate: normalizeVitalSign(formData.heartRate),
    respiratoryRate: normalizeVitalSign(formData.respiratoryRate),
    weight: formData.peso ? parseFloat(formData.peso) : undefined,
    weightUnit: formData.weightUnit,
    recommendations: formData.recomendaciones,
    shouldFinish,
    hospitalization,
  });

  // ============================================
  // HOOK DE RECETA (lógica extraída)
  // ============================================
  const prescriptionFlow = usePrescriptionFlow({
    onSaveConsultation,
    buildConsultationData,
    setHasUnsavedChanges,
  });

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
          appointment.pesoActual != null ? String(appointment.pesoActual) : "",
        weightUnit: normalizeWeightUnit(appointment.pesoActualUnit),
        condicionesPrevias:
          patient.conditions ||
          appointment.condicionesPrevias ||
          appointment.alergiasNotas ||
          "",
        recomendaciones: appointment.recomendaciones || "",
        // En consultas anteriores el cuadro único era "Notas / Diagnóstico":
        // ese texto pasa a ser el diagnóstico para no perder la información.
        diagnostico: appointment.diagnostico || appointment.notas || "",
        notas: appointment.diagnostico ? appointment.notas || "" : "",
        temperature: appointment.temperature || "",
        heartRate: appointment.heartRate || "",
        respiratoryRate: appointment.respiratoryRate || "",
      });
      setInitialAge(edadInicial);
      setIsHospitalizing(false);
      setShowConfirmModal(false);
      setHasUnsavedChanges(false);
      setShowExitConfirmModal(false);
      prescriptionFlow.reset();
    }
  }, [isOpen, appointment, patient]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setHasUnsavedChanges(true);
  };

  /**
   * Al cambiar de kg a g (o viceversa) se convierte el valor ya ingresado
   * para no perder la equivalencia del peso.
   */
  const handleWeightUnitChange = (unit: WeightUnit) => {
    setFormData((prev) => {
      if (prev.weightUnit === unit) return prev;
      const numeric = Number(prev.peso);
      const converted =
        prev.peso.trim() && Number.isFinite(numeric)
          ? String(convertWeight(numeric, prev.weightUnit, unit))
          : prev.peso;
      return { ...prev, peso: converted, weightUnit: unit };
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveOnly = (e: FormEvent) => {
    e.preventDefault();
    saveConditionsIfChanged();
    savePatientDemographics();
    onSaveConsultation(buildConsultationData(false));
    setHasUnsavedChanges(false);
  };

  const handleFinish = () => {
    saveConditionsIfChanged();
    savePatientDemographics();
    prescriptionFlow.startFinishFlow();
  };

  const handleStartHospitalization = () => {
    setIsHospitalizing(true);
    setShowConfirmModal(true);
  };

  const handleConfirmHospitalization = (
    hospitalizationData: HospitalizationFormData,
  ) => {
    // Igual que "Finalizar consulta": las alergias/condiciones críticas deben
    // quedar guardadas en el paciente antes de internarlo, para que aparezcan
    // en el plan de remedios como recordatorio.
    saveConditionsIfChanged();
    savePatientDemographics();
    setIsHospitalizing(false);
    setShowConfirmModal(false);
    onHospitalize?.(buildConsultationData(false, hospitalizationData));
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
    <>
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
            className="flex flex-col flex-1 overflow-hidden"
          >
            <ConsultationForm
              appointment={appointment}
              patient={patient}
              owner={owner}
              formData={formData}
              showCondicionesPrevias={showCondicionesPrevias}
              previewBirthDate={previewBirthDate}
              onChange={handleChange}
              onWeightUnitChange={handleWeightUnitChange}
            />

            {/* Botones de acción */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleStartHospitalization}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isHospitalizing
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400 font-bold"
                    : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30"
                }`}
              >
                <BedDouble className="w-4 h-4" /> Finalizar consulta y hospitalizar
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

          {/* Modales de confirmación */}
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

      {/* Confirmación de hospitalización (se monta al abrir para empezar limpio) */}
      {showConfirmModal && (
        <HospitalizationConfirmModal
          patientName={patient.name}
          onConfirm={handleConfirmHospitalization}
          onCancel={() => {
            setIsHospitalizing(false);
            setShowConfirmModal(false);
          }}
        />
      )}

      {/* Modales de receta */}
      <PrescriptionConfirmModal
        isOpen={prescriptionFlow.showPrescriptionConfirm}
        onConfirm={prescriptionFlow.handleConfirmYes}
        onCancel={prescriptionFlow.handleConfirmNo}
      />

      <PrescriptionFormModal
        isOpen={prescriptionFlow.showPrescriptionForm}
        onSave={prescriptionFlow.handlePrescriptionSave}
        onClose={prescriptionFlow.handlePrescriptionFormClose}
      />
    </>
  );
};
