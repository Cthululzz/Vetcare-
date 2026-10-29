import { useState } from "react";
import { usePrescriptions } from "../../../hooks/usePrescriptions";
import type { ConsultationData } from "./ConsultationModal";
import type { PrescriptionMedication } from "../../../types/prescription";

interface UsePrescriptionFlowOptions {
  onSaveConsultation: (data: ConsultationData) => void;
  buildConsultationData: (shouldFinish: boolean) => ConsultationData;
  setHasUnsavedChanges: (value: boolean) => void;
}

export function usePrescriptionFlow({
  onSaveConsultation,
  buildConsultationData,
  setHasUnsavedChanges,
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
    if (pendingConsultationData) {
      onSaveConsultation(pendingConsultationData);
      setHasUnsavedChanges(false);
      setPendingConsultationData(null);
    }
  };

  const handlePrescriptionSave = (medications: PrescriptionMedication[]) => {
    if (pendingConsultationData) {
      createPrescription(
        pendingConsultationData.patient.id,
        pendingConsultationData.appointment.id,
        medications,
      );
      onSaveConsultation(pendingConsultationData);
      setHasUnsavedChanges(false);
      setPendingConsultationData(null);
    }
    setShowPrescriptionForm(false);
  };

  const handlePrescriptionFormClose = () => {
    setShowPrescriptionForm(false);
    if (pendingConsultationData) {
      onSaveConsultation(pendingConsultationData);
      setHasUnsavedChanges(false);
      setPendingConsultationData(null);
    }
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
