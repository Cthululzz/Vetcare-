import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBranchScope } from "../../context/branchScope";
import { useAuth } from "../../hooks/useAuth";
import { useAppointments } from "../../hooks/useAppointments";
import { usePatients } from "../../hooks/usePatients";
import { useHospitalizations } from "../../hooks/useHospitalizations";
import type { Appointment } from "../../types/appointment";
import type { AppointmentFormData } from "../../components/schedule/AppointmentForm/AppointmentForm";
import { getDoctorName } from "../../constants/appConstants";
import { getLocalTodayStr } from "../../utils/dateUtils";
import { normalizePhone } from "../../utils/phone";
import { necesitaVinculo } from "../../utils/clientMatching";
import type { EditingState, ConsultationData, DayDetail } from "./types";
import type { FinishPrintDocuments } from "../../types/consultation";

export function useScheduleActions() {
  const navigate = useNavigate();
  const { writeScope } = useBranchScope();
  const { user } = useAuth();
  const creadoPor = user?.name ?? user?.email;

  const {
    appointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    updateStatus,
    hasScheduleConflict,
    getAppointmentsEnTodasSedes,
  } = useAppointments();

  const {
    getPatient,
    getPatientEnTodasSedes,
    getOwner,
    getOwnerEnTodasSedes,
    getOwnerForAppointment,
    getPatientsByOwnerEnTodasSedes,
    findCoincidenciasClientes,
    vincularSucursal,
    confirmarVinculosCita,
    desactivarVinculoCita,
    createOwner,
    updateOwner,
    createPatient,
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
      patientId: patient?.id,
      createNewPatient: false,
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

      // Si el usuario descartó el aviso, no se permite crear un duplicado.
      const coincideOtraSede = findCoincidenciasClientes({
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        ownerEmail: data.ownerEmail,
        petName: data.patientName,
        petBreed: data.breed,
        petSpecies: data.species,
      }).find(
        (coincidencia) =>
          coincidencia.confianza === "alta" &&
          necesitaVinculo(coincidencia.owner, scope.sucursalId),
      );
      if (!data.ownerIdVinculado && coincideOtraSede) {
        return "Ese cliente ya está registrado en otra sucursal. Usa la opción «Agregar sucursal» antes de agendar.";
      }

      // 1. Buscar o crear dueño. El nombre manda; el teléfono sólo desempata
      // si hay dos clientes registrados con el mismo nombre. Si el formulario
      // ya eligió una ficha de otra sede, se usa esa y no se crea otra.
      let owner = data.ownerIdVinculado
        ? getOwnerEnTodasSedes(data.ownerIdVinculado)
        : undefined;
      if (!owner) {
        owner = getOwnerForAppointment(data.ownerPhone, data.ownerName);
      }
      if (!owner) {
        owner = createOwner(
          {
            name: data.ownerName.trim(),
            phone: data.ownerPhone.trim(),
            email: data.ownerEmail?.trim() || undefined,
          },
          scope,
        );
      } else {
        const cambios: Partial<{
          name: string;
          phone: string;
          email?: string;
        }> = {};
        if (owner.name !== data.ownerName.trim())
          cambios.name = data.ownerName.trim();
        if (normalizePhone(owner.phone) !== normalizePhone(data.ownerPhone))
          cambios.phone = data.ownerPhone.trim();
        if ((owner.email ?? "") !== (data.ownerEmail?.trim() ?? ""))
          cambios.email = data.ownerEmail?.trim() || undefined;

        if (Object.keys(cambios).length > 0) {
          updateOwner(owner.id, cambios);
          owner = getOwnerEnTodasSedes(owner.id)!;
        }
      }

      // 2. Resolver la mascota. La elección explícita del formulario manda;
      // nunca se sobrescriben especie/raza de una mascota ya registrada.
      const ownerPatients = getPatientsByOwnerEnTodasSedes(owner.id);
      const seleccionada = data.patientId
        ? ownerPatients.find((p) => p.id === data.patientId)
        : undefined;

      let patient: ReturnType<typeof getPatient>;
      if (seleccionada) {
        patient = seleccionada;
      } else if (data.createNewPatient) {
        patient = createPatient({
          name: data.patientName.trim(),
          species: data.species,
          gender: data.gender,
          ownerId: owner.id,
          breed: data.breed,
          vaccineStatus: "pendiente",
        });
      } else {
        const mismaNombre = ownerPatients.find(
          (p) =>
            p.name.trim().toLowerCase() ===
              data.patientName.trim().toLowerCase() && p.isActive,
        );
        patient = mismaNombre
          ? mismaNombre
          : createPatient({
              name: data.patientName.trim(),
              species: data.species,
              gender: data.gender,
              ownerId: owner.id,
              breed: data.breed,
              vaccineStatus: "pendiente",
            });
      }

      if (!patient) {
        return "No se pudo resolver la mascota. Inténtalo nuevamente.";
      }

      // 3. Crear o actualizar la cita
      let citaId = editingState?.appointmentId;
      if (citaId) {
        updateAppointment(citaId, {
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
        const nuevaCita = createAppointment({
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
        citaId = nuevaCita.id;
      }

      // 4. El vínculo nace con la solicitud de cita y lleva su ID. Si la cita
      // se elimina sin atención, este mismo dato permite deshacerlo.
      const ownerActual = getOwnerEnTodasSedes(owner.id);
      if (citaId && ownerActual && necesitaVinculo(ownerActual, scope.sucursalId)) {
        vincularSucursal(owner.id, scope.sucursalId, {
          motivo: "cita",
          citaId,
          creadoPor,
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
      confirmarVinculosCita(appointment.id);
    } else {
      updateStatus(appointment.id, "en_consulta");
    }

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);
  };

  /**
   * Finaliza la consulta y envía al paciente a hospitalización en un solo paso.
   * Escribe el registro médico, marca la cita como finalizada y registra el
   * ingreso. Si se indicó una orden de exámenes, la entrega al pop-up de
   * documentos (imprimir / enviar / omitir) antes de navegar a hospitalización.
   */
  const handleHospitalize = (
    data: ConsultationData,
    onDocumentsReady?: (documents: FinishPrintDocuments | null) => void,
  ) => {
    const {
      patient,
      owner,
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
    confirmarVinculosCita(appointment.id);

    setIsConsultationModalOpen(false);
    setSelectedAppointmentForConsultation(null);

    // 4. La orden con al menos un examen se ofrece en el mismo pop-up que la
    // receta al finalizar la consulta. Quien recibe el documento decide cuándo
    // navegar, para que el usuario no pierda las opciones de impresión/envío.
    const documents: FinishPrintDocuments | null = examOrder?.categories.length
      ? {
          patientName: patient.name,
          ownerEmail: owner.email,
          veterinarian: getDoctorName(appointment.doctorId),
          examOrder,
        }
      : null;

    if (onDocumentsReady) {
      onDocumentsReady(documents);
      return;
    }

    // 5. Llevar al usuario al área de hospitalización para ver el ingreso.
    // El alta se persiste de forma síncrona en localStorage, así que el
    // paciente ya aparece en el listado al llegar a la pantalla.
    navigate("/pacientes/hospitalizados");
  };

  /**
   * Elimina la cita y deshace el vínculo de sucursal si no hubo una atención
   * real (otra cita o un registro clínico) que lo justifique.
   */
  const handleDeleteAppointment = (appointment: Appointment) => {
    const patient = getPatientEnTodasSedes(appointment.patientId);
    const owner = patient ? getOwnerEnTodasSedes(patient.ownerId) : undefined;

    deleteAppointment(appointment.id);
    if (!owner) return;

    const sucursal = appointment.sucursalId;
    const quedanCitas = getAppointmentsEnTodasSedes().some(
      (cita) =>
        cita.id !== appointment.id &&
        cita.sucursalId === sucursal &&
        cita.status !== "cancelada" &&
        getPatientEnTodasSedes(cita.patientId)?.ownerId === owner.id,
    );
    const hayAtencion = getPatientsByOwnerEnTodasSedes(owner.id).some((p) =>
      p.history.some((registro) => registro.sucursalId === sucursal),
    );

    if (!quedanCitas && !hayAtencion) {
      desactivarVinculoCita(owner.id, appointment.id, sucursal);
    }
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
    handleDeleteAppointment,
  };
}
