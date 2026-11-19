import { useState, useMemo, type FormEvent } from "react";
import { Save, CheckCircle2, BedDouble, FlaskConical } from "lucide-react";
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
import { ExamOrderModal } from "./ExamOrderModal";
import { ConsultationForm } from "./ConsultationForm";
import { usePrescriptionFlow } from "./usePrescriptionFlow";
import type { Appointment } from "../../../types/appointment";
import type { Patient, Owner } from "../../../types/patient";
import {
  convertWeight,
  normalizeWeightUnit,
  type WeightUnit,
} from "../../../utils/weight";
import { normalizeVitalSign } from "../../../utils/vitalSigns";
import type {
  ConsultationData,
  HospitalizationFormData,
} from "../../../types/consultation";
import type { ExamOrder } from "../../../types/examOrder";
import { getExamenCategoriaLabel } from "../../../constants/examOrders";
import { PrintExamOrderButton } from "../../print/PrintExamOrderButton";

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

const initialFormDataFor = (appointment: Appointment, patient: Patient) => {
  const edadInicial =
    patient.age || (patient.birthDate ? calculateAge(patient.birthDate) : "");

  return {
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
    diagnostico: appointment.diagnostico || appointment.notas || "",
    notas: appointment.diagnostico ? appointment.notas || "" : "",
    temperature: appointment.temperature || "",
    heartRate: appointment.heartRate || "",
    respiratoryRate: appointment.respiratoryRate || "",
  };
};

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
  const [formData, setFormData] = useState(() =>
    initialFormDataFor(appointment, patient),
  );
  const [initialAge] = useState(formData.edad);
  const [isHospitalizing, setIsHospitalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showExamOrderModal, setShowExamOrderModal] = useState(false);
  const [examOrder, setExamOrder] = useState<ExamOrder | undefined>();

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
    examOrder,
  });

  /**
   * Punto único de confirmación: alergias/condiciones, demografía y cita se
   * guardan juntos solo cuando se resuelve el flujo de receta (Sí/No/cerrar).
   * Evita dejar la alergia guardada con la cita todavía "programada" si el
   * usuario interrumpe la confirmación.
   */
  const commitConsultation = (data: ConsultationData) => {
    saveConditionsIfChanged();
    savePatientDemographics();
    onSaveConsultation(data);
    setHasUnsavedChanges(false);
  };

  // ============================================
  // HOOK DE RECETA (lógica extraída)
  // ============================================
  const prescriptionFlow = usePrescriptionFlow({
    onSaveConsultation: commitConsultation,
    buildConsultationData,
    setHasUnsavedChanges,
  });

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

            {/* Orden de exámenes */}
            <div className="px-6 pb-2">
              {examOrder && examOrder.categories.length > 0 && (
                <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-300">
                        Orden de exámenes
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {examOrder.categories.map((category) => (
                          <span
                            key={category}
                            className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-200"
                          >
                            {getExamenCategoriaLabel(category)}
                          </span>
                        ))}
                      </div>
                      {examOrder.notes && (
                        <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-300">
                          {examOrder.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowExamOrderModal(true)}
                        className="text-[11px] font-semibold text-violet-300 hover:text-violet-200"
                      >
                        Editar
                      </button>
                      <PrintExamOrderButton
                        order={examOrder}
                        patientName={patient.name}
                      />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowExamOrderModal(true)}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  examOrder
                    ? "border-violet-500/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
                    : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-violet-500/40 hover:text-violet-200"
                }`}
              >
                <FlaskConical className="h-4 w-4" />
                {examOrder ? "Editar orden de exámenes" : "Orden de exámenes"}
              </button>
            </div>

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
          scope={appointment}
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

      <ExamOrderModal
        isOpen={showExamOrderModal}
        initialOrder={examOrder}
        onSave={(order) => {
          setExamOrder(order);
          setShowExamOrderModal(false);
          setHasUnsavedChanges(true);
        }}
        onClose={() => setShowExamOrderModal(false)}
      />
    </>
  );
};
