import { useState } from "react";
import { getDoctorName } from "../../../constants/appConstants";
import { usePrescriptions } from "../../../hooks/usePrescriptions";
import type {
  ConsultationData,
  FinishPrintDocuments,
} from "../../../types/consultation";
import type {
  Prescription,
  PrescriptionMedication,
} from "../../../types/prescription";

interface UsePrescriptionFlowOptions {
  onSaveConsultation: (data: ConsultationData) => void;
  buildConsultationData: (shouldFinish: boolean) => ConsultationData;
  setHasUnsavedChanges: (value: boolean) => void;
  /** Se llama al terminar la consulta si hay documentos para imprimir. */
  onFinishComplete?: (documents: FinishPrintDocuments) => void;
}

export function usePrescriptionFlow({
  onSaveConsultation,
  buildConsultationData,
  setHasUnsavedChanges,
  onFinishComplete,
}: UsePrescriptionFlowOptions) {
  const { createPrescription } = usePrescriptions();

  const [showPrescriptionConfirm, setShowPrescriptionConfirm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [pendingConsultationData, setPendingConsultationData] =
    useState<ConsultationData | null>(null);

  const reset = () => {
    setShowPrescriptionConfirm(false);
    setShowPrescriptionForm(false);
    setPendingConsultationData(null);
  };

  /**
   * Cierra el flujo de finalización. Guarda la consulta y, si se generó algún
   * documento, avisa al padre para que muestre el pop-up de impresión fuera
   * del modal de consulta (que se desmonta al guardar).
   */
  const completar = (data: ConsultationData, prescription?: Prescription) => {
    onSaveConsultation(data);
    setHasUnsavedChanges(false);
    setPendingConsultationData(null);

    const examOrder = data.examOrder?.categories.length
      ? data.examOrder
      : undefined;
    if (!prescription && !examOrder) return;

    onFinishComplete?.({
      patientName: data.patient.name,
      veterinarian: getDoctorName(data.appointment.doctorId),
      prescription,
      examOrder,
    });
  };

  const startFinishFlow = () => {
    const data = buildConsultationData(true);
    setPendingConsultationData(data);
    setShowPrescriptionConfirm(true);
  };

  const handleConfirmYes = () => {
    setShowPrescriptionConfirm(false);
    setShowPrescriptionForm(true);
  };

  const handleConfirmNo = () => {
    setShowPrescriptionConfirm(false);
    if (pendingConsultationData) completar(pendingConsultationData);
  };

  const handlePrescriptionSave = (medications: PrescriptionMedication[]) => {
    if (pendingConsultationData) {
      const prescription = createPrescription(
        pendingConsultationData.patient.id,
        pendingConsultationData.appointment.id,
        medications,
        undefined,
        pendingConsultationData.appointment,
      );
      completar(pendingConsultationData, prescription);
    }
    setShowPrescriptionForm(false);
  };

  const handlePrescriptionFormClose = () => {
    setShowPrescriptionForm(false);
    if (pendingConsultationData) completar(pendingConsultationData);
  };

  return {
    showPrescriptionConfirm,
    showPrescriptionForm,
    startFinishFlow,
    handleConfirmYes,
    handleConfirmNo,
    handlePrescriptionSave,
    handlePrescriptionFormClose,
    reset,
  };
}
