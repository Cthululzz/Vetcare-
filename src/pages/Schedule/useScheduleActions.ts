import { useState } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import { usePatients } from "../../hooks/usePatients";
import { useHospitalizations } from "../../hooks/useHospitalizations";
import type { Appointment } from "../../types/appointment";
import type { AppointmentFormData } from "../../components/schedule/AppointmentForm/AppointmentForm";
import { getLocalTodayStr } from "../../utils/dateUtils";
import type { EditingState, ConsultationData, DayDetail } from "./types";

export function useScheduleActions() {
  const {
    appointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
  } = useAppointments();

  const {
    getPatient,
    getOwner,
    getOwnerByPhone,
    getPatientsByOwner,
    createOwner,
    updateOwner,
    createPatient,
    updatePatient,
    addMedicalRecord,
  } = usePatients();

  // ← NUEVO: Hook de hospitalizaciones
  const { admitPatient } = useHospitalizations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [
    selectedAppointmentForConsultation,
    setSelectedAppointmentForConsultation,
  ] = useState<Appointment | null>(null);
  const [selectedDayDetail, setSelectedDayDetail] = useState<DayDetail | null>(
    null,
  );

  const todayStr = getLocalTodayStr();

  const appointmentToFormData = (
    appointment: Appointment,
  ): AppointmentFormData => {
    const patient = getPatient(appointment.patientId);
    const owner = patient ? getOwner(patient.ownerId) : null;

    return {
      ownerName: owner?.name || "",
      ownerPhone: owner?.phone || "",
      ownerEmail: owner?.email,
      patientName: patient?.name || "",
      species: patient?.species || "perro",
      breed: patient?.breed,
      gender: patient?.gender || "macho",
      doctorId: appointment.doctorId,
      sucursalId: appointment.sucursalId,
      fecha: appointment.fecha,
      hora: appointment.hora,
      motivo: appointment.motivo,
      tipo: appointment.tipo,
      alergiasNotas: appointment.alergiasNotas,
    };
  };

  const handleOpenNew = (dateStr?: string) => {
    setEditingState({
      appointmentId: undefined,
      initialFormData: { fecha: dateStr || todayStr },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (appointment: Appointment) => {
    const formData = appointmentToFormData(appointment);
    setEditingState({
      appointmentId: appointment.id,
      initialFormData: formData,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingState(null);
  };

  const handleSaveAppointment = (data: AppointmentFormData) => {
    try {
      // 1. Buscar o crear dueño
      let owner = getOwnerByPhone(data.ownerPhone);
      if (!owner) {
        owner = createOwner({
          name: data.ownerName,
          phone: data.ownerPhone,
          email: data.ownerEmail,
        });
      } else if (
        owner.name !== data.ownerName ||
        owner.email !== data.ownerEmail
      ) {
        updateOwner(owner.id, {
          name: data.ownerName,
          email: data.ownerEmail,
        });
        owner = getOwnerByPhone(data.ownerPhone)!;
      }

      // 2. Buscar o crear paciente
      const ownerPatients = getPatientsByOwner(owner.id);
      let patient = ownerPatients.find(
        (p) =>
          p.name.toLowerCase() === data.patientName.toLowerCase() && p.isActive,
      );

      if (!patient) {
        patient = createPatient({
          name: data.patientName,
          species: data.species,
          gender: data.gender,
          ownerId: owner.id,
          breed: data.breed,
          vaccineStatus: "pendiente",
        });
      } else if (
        patient.species !== data.species ||
        patient.gender !== data.gender ||
        patient.breed !== data.breed
      ) {
        updatePatient(patient.id, {
          species: data.species,
          gender: data.gender,
          breed: data.breed,
        });
      }

      // 3. Crear o actualizar la cita
      if (editingState?.appointmentId) {
        updateAppointment(editingState.appointmentId, {
          patientId: patient.id,
          ownerId: owner.id,
          doctorId: data.doctorId,
          sucursalId: data.sucursalId,
          fecha: data.fecha,
          hora: data.hora,
          motivo: data.motivo,
          tipo: data.tipo,
          alergiasNotas: data.alergiasNotas,
        });
      } else {
        createAppointment({
          patientId: patient.id,
          ownerId: owner.id,
          doctorId: data.doctorId,
          sucursalId: data.sucursalId,
          fecha: data.fecha,
          hora: data.hora,
          motivo: data.motivo,
          tipo: data.tipo,
          alergiasNotas: data.alergiasNotas,
          status: "programada",
          pesoActual: undefined,
          condicionesPrevias: undefined,
          recomendaciones: undefined,
          notas: undefined,
        });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error en handleSaveAppointment:", error);
    }
  };

  const handleStartConsultation = (appointment: Appointment) => {
    setSelectedAppointmentForConsultation(appointment);
    setIsConsultationModalOpen(true);
  };

  /**
   * Guarda los datos de la consulta.
   * - SIEMPRE persiste el borrador en la cita (para poder retomarlo).
   * - SOLO al finalizar crea el registro en el historial y marca finalizada.
   */
  const handleSaveConsultation = (consultationData: ConsultationData) => {
    const {
      patient,
      appointment,
      notes,
      weight,
      recommendations,
      shouldFinish,
    } = consultationData;

    // 1. Persistir borrador en la cita (siempre)
    updateAppointment(appointment.id, {
      notas: notes,
      recomendaciones: recommendations,
      pesoActual: weight,
    });

    // 2. Solo al finalizar: registro en historial + estado finalizada
    if (shouldFinish) {
      addMedicalRecord(patient.id, {
        date: new Date().toISOString(),
        notes,
        weight,
        recommendations,
      });
      updateStatus(appointment.id, "finalizada");
    } else {
      updateStatus(appointment.id, "en_consulta");
    }

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);
  };

  /**
   * Envía al paciente a hospitalización desde la consulta.
   * Persiste el borrador, registra el ingreso y mantiene la consulta abierta.
   */
  const handleHospitalize = (data: ConsultationData) => {
    const { patient, appointment, notes, weight, recommendations } = data;

    // 1. Persistir borrador en la cita
    updateAppointment(appointment.id, {
      notas: notes,
      recomendaciones: recommendations,
      pesoActual: weight,
    });

    // 2. Registrar ingreso a hospitalización
    admitPatient(patient.id, notes || undefined);

    // 3. La consulta queda en curso (el paciente sigue en atención)
    updateStatus(appointment.id, "en_consulta");

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);
  };

  const handleCloseConsultation = () => {
    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);
  };

  const modalPatient = selectedAppointmentForConsultation
    ? getPatient(selectedAppointmentForConsultation.patientId)
    : null;
  const modalOwner = modalPatient ? getOwner(modalPatient.ownerId) : null;

  return {
    appointments,
    deleteAppointment,
    isModalOpen,
    editingState,
    isConsultationModalOpen,
    selectedAppointmentForConsultation,
    selectedDayDetail,
    setSelectedDayDetail,
    modalPatient,
    modalOwner,
    handleOpenNew,
    handleOpenEdit,
    handleCloseModal,
    handleSaveAppointment,
    handleStartConsultation,
    handleSaveConsultation,
    handleHospitalize, // ← NUEVO: expuesto
    handleCloseConsultation,
  };
}
