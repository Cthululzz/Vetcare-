import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBranchScope } from "../../context/branchScope";
import { useAppointments } from "../../hooks/useAppointments";
import { usePatients } from "../../hooks/usePatients";
import { useHospitalizations } from "../../hooks/useHospitalizations";
import type { Appointment } from "../../types/appointment";
import type { AppointmentFormData } from "../../components/schedule/AppointmentForm/AppointmentForm";
import { getDoctorName } from "../../constants/appConstants";
import { getLocalTodayStr } from "../../utils/dateUtils";
import type { EditingState, ConsultationData, DayDetail } from "./types";

export function useScheduleActions() {
  const navigate = useNavigate();
  const { writeScope } = useBranchScope();

  const {
    appointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
    hasScheduleConflict,
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

  const handleSaveAppointment = (data: AppointmentFormData): string | null => {
    // 0. Validaciones básicas
    if (!data.ownerName.trim() || !data.ownerPhone.trim()) {
      return "Completa el nombre y el teléfono del propietario.";
    }
    if (!data.patientName.trim()) {
      return "Ingresa el nombre del paciente.";
    }
    if (!data.fecha || !data.hora) {
      return "Selecciona la fecha y la hora de la cita.";
    }
    if (
      hasScheduleConflict(
        data.doctorId,
        data.fecha,
        data.hora,
        editingState?.appointmentId,
      )
    ) {
      return "Ese profesional ya tiene una cita agendada en esa fecha y hora. Elige otro horario o doctor.";
    }

    try {
      // La sucursal elegida se valida una sola vez y se usa para todas las
      // entidades nuevas de este flujo (dueño, paciente y cita).
      const scope = writeScope(data.sucursalId);

      // 1. Buscar o crear dueño
      let owner = getOwnerByPhone(data.ownerPhone);
      if (!owner) {
        owner = createOwner(
          {
            name: data.ownerName,
            phone: data.ownerPhone,
            email: data.ownerEmail,
          },
          scope,
        );
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
          // No se re-alcancea una cita existente: sus derivadas ya tienen el
          // alcance original y el selector queda bloqueado al editar.
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
          sucursalId: scope.sucursalId,
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
      return null;
    } catch (error) {
      console.error("Error en handleSaveAppointment:", error);
      return "Ocurrió un error al guardar la cita. Inténtalo nuevamente.";
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
      diagnosis,
      temperature,
      heartRate,
      respiratoryRate,
      weight,
      weightUnit,
      recommendations,
      shouldFinish,
      examOrder,
    } = consultationData;

    // 1. Persistir borrador en la cita (siempre)
    updateAppointment(appointment.id, {
      notas: notes,
      diagnostico: diagnosis,
      temperature,
      heartRate,
      respiratoryRate,
      recomendaciones: recommendations,
      pesoActual: weight,
      pesoActualUnit: weightUnit,
    });

    // 2. Solo al finalizar: registro en historial + estado finalizada
    if (shouldFinish) {
      addMedicalRecord(patient.id, {
        date: new Date().toISOString(),
        notes,
        diagnosis,
        temperature,
        heartRate,
        respiratoryRate,
        weight,
        weightUnit,
        recommendations,
        type: "consulta",
        veterinarian: getDoctorName(appointment.doctorId),
        examOrder,
      },
      appointment,
      );
      updateStatus(appointment.id, "finalizada");
    } else {
      updateStatus(appointment.id, "en_consulta");
    }

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);
  };

  /**
   * Finaliza la consulta y envía al paciente a hospitalización en un solo paso.
   * Escribe el registro médico, marca la cita como finalizada, registra el
   * ingreso y lleva al usuario al área de hospitalización para que vea al
   * paciente ya internado.
   */
  const handleHospitalize = (data: ConsultationData) => {
    const {
      patient,
      appointment,
      notes,
      diagnosis,
      temperature,
      heartRate,
      respiratoryRate,
      weight,
      weightUnit,
      recommendations,
      hospitalization,
      examOrder,
    } = data;

    // 1. Persistir borrador en la cita
    updateAppointment(appointment.id, {
      notas: notes,
      diagnostico: diagnosis,
      temperature,
      heartRate,
      respiratoryRate,
      recomendaciones: recommendations,
      pesoActual: weight,
      pesoActualUnit: weightUnit,
    });

    // 2. Registrar ingreso a hospitalización (hereda la sucursal de la cita).
    // El diagnóstico, la frecuencia y los planes vienen del popup de confirmación.
    const ingreso = admitPatient(patient.id, hospitalization?.reason, {
      organizationId: appointment.organizationId,
      sucursalId: appointment.sucursalId,
      weight,
      weightUnit,
      diagnosis,
      monitoringFrequency: hospitalization?.monitoringFrequency,
      medicationPlans: hospitalization?.medicationPlans,
      createdBy: getDoctorName(appointment.doctorId),
    });

    if (!ingreso) {
      window.alert(
        "No se pudo registrar el ingreso a hospitalización. Revisa si el paciente ya está internado o si la cama está ocupada. La consulta no se finalizó.",
      );
      return;
    }

    // 3. Finalizar la consulta: registro en el historial y cita finalizada.
    // Así no hay que hacerlo manualmente después de hospitalizar.
    addMedicalRecord(patient.id, {
      date: new Date().toISOString(),
      notes,
      diagnosis,
      temperature,
      heartRate,
      respiratoryRate,
      weight,
      weightUnit,
      recommendations,
      type: "consulta",
      veterinarian: getDoctorName(appointment.doctorId),
      examOrder,
    },
    appointment,
    );
    updateStatus(appointment.id, "finalizada");

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);

    // 4. Llevar al usuario al área de hospitalización para ver el ingreso.
    // El alta se persiste de forma síncrona en localStorage, así que el
    // paciente ya aparece en el listado al llegar a la pantalla.
    navigate("/pacientes/hospitalizados");
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
