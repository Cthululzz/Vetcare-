import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Bell,
  CalendarClock,
  CheckCircle,
  History,
  MessageCircle,
  Pill,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Footer } from "../components/common/Footer";
import { usePatients } from "../hooks/usePatients";
import {
  isReviewOverdue,
  isReviewPending,
  useHospitalizations,
} from "../hooks/useHospitalizations";
import { useInventory } from "../hooks/useInventory";
import { useInventoryMovements } from "../hooks/useInventoryMovements";
import { useHospitalBeds } from "../hooks/useHospitalBeds";
import { useAuth } from "../hooks/useAuth";
import { AdmissionFormModal } from "../components/hospitalization/AdmissionFormModal";
import type { AdmissionData } from "../components/hospitalization/AdmissionFormModal";
import {
  EvolutionFormModal,
  type EvolutionData,
} from "../components/hospitalization/EvolutionFormModal";
import { DischargeConfirmModal } from "../components/hospitalization/DischargeConfirmModal";
import type { DischargeData } from "../components/hospitalization/DischargeConfirmModal";
import { MedicationAdministrationModal } from "../components/hospitalization/MedicationAdministrationModal";
import type { MedicationAdministrationData } from "../components/hospitalization/MedicationAdministrationModal";
import { HospitalizationDetailModal } from "../components/hospitalization/HospitalizationDetailModal";
import { BedMap } from "../components/hospitalization/BedMap";
import type { Patient, Owner } from "../types/patient";
import type {
  Hospitalization,
  MedicationAdministration,
} from "../types/hospitalization";
import {
  DEFAULT_MONITORING_FREQUENCY,
  calcularProximaRevision,
} from "../constants/hospitalization";
import { getSucursalName } from "../constants/appConstants";
import { formatDateShort, formatDateTimeShort } from "../utils/dateUtils";
import {
  buildDischargeMessage,
  buildReviewReminderMessage,
  buildWhatsAppLink,
} from "../utils/whatsappUtils";
import {
  formatFractionWithUnit,
  formatPackageEquivalence,
  formatQuantityDisplay,
  isMeasuredUnit,
} from "../utils/inventoryUnits";

// ============================================
// TIPOS INTERNOS
// ============================================
type TabType = "activos" | "altas";

interface HospitalizedPatientView {
  hospitalization: Hospitalization;
  patient: Patient;
  owner: Owner | undefined;
  bed: string;
  status: string;
  reason: string;
  diagnosis?: string;
  admissionDate: string;
  nextReviewAt?: string;
  reviewPending: boolean;
  reviewOverdue: boolean;
}

interface FeedbackMessage {
  type: "success" | "error";
  message: string;
}

// ============================================
// UTILIDADES DE FORMATO
// ============================================

/**
 * Formatea una fecha-hora ISO a "dd/mm/aaaa HH:MM".
 */
const formatTimestamp = (dateStr?: string): string => {
  if (!dateStr) return "No registrado";
  return formatDateTimeShort(dateStr) || "No registrado";
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return "No programada";
  return formatDateTimeShort(dateStr) || "No programada";
};

const formatDateOnly = (value?: string): string => {
  if (!value) return "No programado";
  if (value.length === 10) return formatDateShort(value);
  const formatted = formatDateTimeShort(value);
  return formatted ? formatted.slice(0, 10) : "No programado";
};

const localDateTimeToIso = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const dateInputToIso = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const formatMedicationDose = (
  medication: MedicationAdministration,
): string => {
  const amount = medication.dose ?? medication.quantity;
  const unit = medication.doseUnit ?? medication.unit;
  return unit ? formatFractionWithUnit(amount, unit) : `${amount}`;
};

const formatSpeciesAndBreed = (patient: Patient): string => {
  const speciesLabels: Record<string, string> = {
    perro: "Perro",
    gato: "Gato",
    exoticos: "Exótico",
  };

  const species = speciesLabels[patient.species] || patient.species;
  return patient.breed ? `${species} (${patient.breed})` : species;
};

const buildEvolutionNotes = (data: EvolutionData): string => {
  let notes = `EVOLUCIÓN HOSPITALIZACIÓN\n\n${data.notes}`;

  const vitalSigns: string[] = [];
  if (data.temperature)
    vitalSigns.push(`Temperatura: ${data.temperature}°C`);
  if (data.heartRate) vitalSigns.push(`Frec. Cardíaca: ${data.heartRate} lpm`);
  if (data.respiratoryRate)
    vitalSigns.push(`Frec. Respiratoria: ${data.respiratoryRate} rpm`);

  if (vitalSigns.length > 0) {
    notes += `\n\nSIGNOS VITALES\n${vitalSigns.join("\n")}`;
  }

  if (data.treatmentChanges) {
    notes += `\n\nCAMBIOS EN TRATAMIENTO\n${data.treatmentChanges}`;
  }

  if (data.nursingObservations) {
    notes += `\n\nOBSERVACIONES DE ENFERMERÍA\n${data.nursingObservations}`;
  }

  return notes;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const HospitalizationView = () => {
  const navigate = useNavigate();

  const { getOwner, getPatient, getActivePatients, addMedicalRecord } =
    usePatients();
  const {
    hospitalizations,
    admitPatient,
    addEvolution,
    addMedicationAdministration,
    updateMedicationAdministration,
    removeMedicationAdministration,
    dischargePatient,
    getActiveHospitalizations,
    getDischargedHospitalizations,
    getAvailableBeds,
    isHospitalized,
    isBedOccupied,
  } = useHospitalizations();
  const { beds, addBed, removeBed } = useHospitalBeds();
  const { getProducts, getProduct } = useInventory();
  const { createMovement } = useInventoryMovements();
  const { user } = useAuth();

  // Estados de pestañas y modales
  const [activeTab, setActiveTab] = useState<TabType>("activos");
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedHospitalizationId, setSelectedHospitalizationId] = useState<
    string | null
  >(null);
  const [editingMedication, setEditingMedication] =
    useState<MedicationAdministration | null>(null);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const selectedHospitalization =
    hospitalizations.find((h) => h.id === selectedHospitalizationId) ?? null;

  // ============================================
  // DATOS DERIVADOS
  // ============================================

  const activeViews: HospitalizedPatientView[] =
    getActiveHospitalizations().map(({ hospitalization, patient }) => {
      const nextReviewAt = hospitalization.nextReviewAt;
      const reviewOverdue = isReviewOverdue(hospitalization);

      return {
        hospitalization,
        patient,
        owner: getOwner(patient.ownerId),
        bed: hospitalization.bed || "Sin cama",
        status: reviewOverdue ? "Revisión vencida" : "En observación",
        reason: hospitalization.reason || "No especificado",
        diagnosis: hospitalization.diagnosis,
        admissionDate: hospitalization.admittedAt,
        nextReviewAt,
        reviewPending: isReviewPending(hospitalization),
        reviewOverdue,
      };
    });

  const dischargedViews = getDischargedHospitalizations();
  const availableBeds = getAvailableBeds();
  const patientsParaIngreso = getActivePatients().filter(
    (patient) => !isHospitalized(patient.id),
  );
  const products = getProducts();

  const bedMapItems = beds.map((bed) => {
    const entry = activeViews.find(
      (item) => item.hospitalization.bed === bed,
    );

    return {
      bed,
      patientName: entry?.patient.name,
      hospitalizationId: entry?.hospitalization.id,
    };
  });

  // Estadísticas derivadas de datos reales
  const totalInternados = activeViews.length;
  const revisionesPendientes = activeViews.filter(
    (item) => item.reviewPending,
  ).length;
  const camasDisponibles = availableBeds.length;
  const totalCamas = beds.length;
  const totalAltas = dischargedViews.length;

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenAdmission = () => {
    setFeedback(null);
    setShowAdmissionModal(true);
  };

  const handleAdmit = (data: AdmissionData): string | null => {
    if (isHospitalized(data.patientId)) {
      return "Ese paciente ya tiene una hospitalización activa.";
    }
    if (data.bed && isBedOccupied(data.bed)) {
      return "La cama seleccionada ya está ocupada. Elige otra.";
    }

    const nextReviewAt = calcularProximaRevision(data.monitoringFrequency);

    const created = admitPatient(data.patientId, data.reason, {
      bed: data.bed,
      diagnosis: data.diagnosis,
      weight: data.weight,
      monitoringFrequency: data.monitoringFrequency,
      nextReviewAt,
      notes: data.initialTreatment,
      sucursalId: data.sucursalId,
      createdBy: user?.name,
    });

    if (!created) {
      return "No se pudo registrar el ingreso. Revisa los datos e inténtalo nuevamente.";
    }

    const patient = getPatient(data.patientId);

    addMedicalRecord(data.patientId, {
      date: new Date().toISOString(),
      weight: data.weight,
      notes: [
        "INGRESO A HOSPITALIZACIÓN",
        `Motivo: ${data.reason}`,
        data.diagnosis ? `Diagnóstico presuntivo: ${data.diagnosis}` : "",
        `Peso al ingreso: ${data.weight} kg`,
        `Cama: ${data.bed}`,
        `Sucursal: ${getSucursalName(data.sucursalId)}`,
        `Frecuencia de monitoreo: cada ${data.monitoringFrequency} horas`,
        `Primera revisión: ${formatDateTime(nextReviewAt)}`,
        data.initialTreatment
          ? `\nTratamiento inicial:\n${data.initialTreatment}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      recommendations:
        "Paciente hospitalizado. Monitoreo y tratamiento según indicaciones médicas.",
    });

    setShowAdmissionModal(false);
    setFeedback({
      type: "success",
      message: `${patient?.name ?? "El paciente"} ingresó a hospitalización en ${data.bed}.`,
    });

    return null;
  };

  const handleRegistrarEvolucion = (
    hospitalization: Hospitalization,
    patient: Patient,
  ) => {
    setFeedback(null);
    setSelectedHospitalizationId(hospitalization.id);
    setSelectedPatient(patient);
    setShowEvolutionModal(true);
  };

  /**
   * Guarda la evolución en la internación y en el historial del paciente.
   */
  const handleSaveEvolution = (
    patientId: string,
    evolutionData: EvolutionData,
  ) => {
    const active = getActiveHospitalizations().find(
      (item) => item.patient.id === patientId,
    );

    if (!active) {
      setFeedback({
        type: "error",
        message: "No se encontró una hospitalización activa para este paciente.",
      });
      return;
    }

    const nextReviewAt =
      localDateTimeToIso(evolutionData.nextReviewAt) ??
      calcularProximaRevision(
        active.hospitalization.monitoringFrequency ??
          DEFAULT_MONITORING_FREQUENCY,
      );

    addEvolution(active.hospitalization.id, {
      notes: evolutionData.notes,
      temperature: evolutionData.temperature?.trim() || undefined,
      heartRate: evolutionData.heartRate?.trim() || undefined,
      respiratoryRate: evolutionData.respiratoryRate?.trim() || undefined,
      treatmentChanges: evolutionData.treatmentChanges?.trim() || undefined,
      nursingObservations:
        evolutionData.nursingObservations?.trim() || undefined,
      nextReviewAt,
      createdBy: user?.name,
    });

    addMedicalRecord(patientId, {
      date: new Date().toISOString(),
      notes: buildEvolutionNotes(evolutionData),
      recommendations: `Continuar monitoreo según evolución. Próxima revisión: ${formatDateTime(nextReviewAt)}.`,
    });

    setShowEvolutionModal(false);
    setSelectedHospitalizationId(null);
    setSelectedPatient(null);
    setFeedback({
      type: "success",
      message: `Evolución registrada. Próxima revisión: ${formatDateTime(nextReviewAt)}.`,
    });
  };

  const handleDarDeAlta = (
    hospitalization: Hospitalization,
    patient: Patient,
  ) => {
    setFeedback(null);
    setSelectedHospitalizationId(hospitalization.id);
    setSelectedPatient(patient);
    setShowDischargeModal(true);
  };

  const handleConfirmDischarge = (data: DischargeData) => {
    if (!selectedHospitalization || !selectedPatient) return;

    const nextControlAt = dateInputToIso(data.nextControlAt);

    dischargePatient(selectedHospitalization.id, {
      diagnosis: data.diagnosis,
      treatment: data.treatment,
      indications: data.indications,
      nextControlAt,
      dischargedBy: user?.name,
    });

    addMedicalRecord(selectedPatient.id, {
      date: new Date().toISOString(),
      notes: [
        "ALTA MÉDICA - Fin de hospitalización",
        `Diagnóstico de alta: ${data.diagnosis}`,
        data.treatment ? `Tratamiento realizado: ${data.treatment}` : "",
        `Indicaciones: ${data.indications}`,
        data.nextControlAt
          ? `Próximo control: ${formatDateOnly(data.nextControlAt)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      recommendations: data.indications,
    });

    setShowDischargeModal(false);
    setSelectedHospitalizationId(null);
    setSelectedPatient(null);
    setFeedback({
      type: "success",
      message: `${selectedPatient.name} fue dado de alta. La cama quedó disponible.`,
    });
  };

  const handleOpenMedication = (
    hospitalization: Hospitalization,
    patient: Patient,
  ) => {
    setFeedback(null);
    setEditingMedication(null);
    setSelectedHospitalizationId(hospitalization.id);
    setSelectedPatient(patient);
    setShowMedicationModal(true);
  };

  const handleEditMedication = (medication: MedicationAdministration) => {
    setFeedback(null);
    setEditingMedication(medication);
    setShowMedicationModal(true);
  };

  /**
   * Registra una nueva administración o actualiza una existente.
   * La cantidad administrada se descuenta siempre en la unidad del producto.
   */
  const handleSaveMedication = (
    data: MedicationAdministrationData,
  ): string | null => {
    if (!selectedHospitalization || !selectedPatient) {
      return "No hay una hospitalización seleccionada.";
    }

    const product = getProduct(data.productId);
    if (!product) return "No se encontró el producto en inventario.";

    const wasEditing = Boolean(editingMedication);
    const previousQuantity =
      editingMedication?.quantity ?? editingMedication?.dose ?? 0;
    const availableStock = product.currentStock + previousQuantity;

    if (data.quantity > availableStock) {
      return `Stock insuficiente: quedan ${formatQuantityDisplay(
        availableStock,
        product,
      )}.`;
    }

    const stockDelta = data.quantity - previousQuantity;

    if (editingMedication) {
      updateMedicationAdministration(
        selectedHospitalization.id,
        editingMedication.id,
        {
          quantity: data.quantity,
          unit: product.unit,
          // Los registros nuevos usan solo quantity + unit.
          dose: undefined,
          doseUnit: undefined,
          notes: data.notes,
        },
      );
    } else {
      addMedicationAdministration(selectedHospitalization.id, {
        productId: product.id,
        productName: product.name,
        quantity: data.quantity,
        unit: product.unit,
        notes: data.notes,
        createdBy: user?.name,
      });
    }

    if (stockDelta !== 0) {
      createMovement({
        productId: product.id,
        type: stockDelta > 0 ? "retiro" : "devolucion",
        quantity: Math.abs(stockDelta),
        unit: product.unit,
        reason: wasEditing
          ? "Ajuste de medicación o consumo"
          : "Medicación o consumo en hospitalización",
        userName: user?.name,
        userRole: user?.role,
        patientName: selectedPatient.name,
        isComplete: true,
      });
    }

    const baseQuantityLabel = formatFractionWithUnit(
      data.quantity,
      product.unit,
    );
    const equivalence = isMeasuredUnit(product.unit)
      ? formatPackageEquivalence(data.quantity, product)
      : null;
    const quantityLabel = equivalence
      ? `${baseQuantityLabel} (${equivalence})`
      : baseQuantityLabel;

    setShowMedicationModal(false);
    setEditingMedication(null);

    if (wasEditing) {
      // La ficha de hospitalización sigue abierta para ver el cambio.
      setFeedback({
        type: "success",
        message: `Se actualizó el registro de ${product.name} (${quantityLabel}).`,
      });
      return null;
    }

    setSelectedHospitalizationId(null);
    setSelectedPatient(null);
    setFeedback({
      type: "success",
      message: `Se registró ${quantityLabel} de ${product.name} y se descontó del inventario.`,
    });

    return null;
  };

  const handleDeleteMedication = (medication: MedicationAdministration) => {
    if (!selectedHospitalization || !selectedPatient) return;

    const confirmed = window.confirm(
      `¿Eliminar el registro de ${medication.productName} (${formatMedicationDose(medication)})?`,
    );
    if (!confirmed) return;

    const returnedQuantity = medication.quantity ?? medication.dose ?? 0;

    if (returnedQuantity > 0) {
      createMovement({
        productId: medication.productId,
        type: "devolucion",
        quantity: returnedQuantity,
        unit: medication.unit ?? medication.doseUnit,
        reason: "Eliminación de registro de medicación o consumo",
        userName: user?.name,
        userRole: user?.role,
        patientName: selectedPatient.name,
        isComplete: true,
      });
    }

    removeMedicationAdministration(
      selectedHospitalization.id,
      medication.id,
    );

    setFeedback({
      type: "success",
      message: `Se eliminó el registro de ${medication.productName}.`,
    });
  };

  const handleAddBed = () => {
    const bed = addBed();
    setFeedback({
      type: "success",
      message: `Se agregó ${bed} al área de hospitalización.`,
    });
  };

  const handleRemoveBed = (bed: string) => {
    if (isBedOccupied(bed)) {
      setFeedback({
        type: "error",
        message: `No puedes quitar ${bed}: está ocupada por un paciente hospitalizado.`,
      });
      return;
    }

    if (beds.length <= 1) {
      setFeedback({
        type: "error",
        message: "Debe existir al menos una cama configurada.",
      });
      return;
    }

    removeBed(bed);
    setFeedback({
      type: "success",
      message: `Se quitó ${bed} del área de hospitalización.`,
    });
  };

  const handleOpenDetail = (
    hospitalization: Hospitalization,
    patient: Patient,
  ) => {
    setSelectedHospitalizationId(hospitalization.id);
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const handleOpenDetailById = (hospitalizationId: string) => {
    const entry = activeViews.find(
      (item) => item.hospitalization.id === hospitalizationId,
    );
    if (entry) {
      handleOpenDetail(entry.hospitalization, entry.patient);
    }
  };

  const handleSendReviewReminder = (item: HospitalizedPatientView) => {
    const phone = item.owner?.phone;
    if (!phone) {
      setFeedback({
        type: "error",
        message: "El propietario no tiene teléfono registrado.",
      });
      return;
    }

    const message = buildReviewReminderMessage({
      patientName: item.patient.name,
      reviewDate: formatDateTime(item.nextReviewAt),
      sucursal: item.hospitalization.sucursalId
        ? getSucursalName(item.hospitalization.sucursalId)
        : undefined,
    });

    window.open(
      buildWhatsAppLink(phone, message),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleSendDischargeReminder = (
    hospitalization: Hospitalization,
    patient: Patient,
    owner: Owner | undefined,
  ) => {
    const phone = owner?.phone;
    if (!phone) {
      setFeedback({
        type: "error",
        message: "El propietario no tiene teléfono registrado.",
      });
      return;
    }

    const summary = hospitalization.dischargeSummary;
    const message = buildDischargeMessage({
      patientName: patient.name,
      sucursal: hospitalization.sucursalId
        ? getSucursalName(hospitalization.sucursalId)
        : undefined,
      nextControlDate: summary?.nextControlAt
        ? formatDateOnly(summary.nextControlAt)
        : undefined,
      indications: summary?.indications,
    });

    window.open(
      buildWhatsAppLink(phone, message),
      "_blank",
      "noopener,noreferrer",
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] justify-between w-full px-4 sm:px-6 lg:px-8 mx-auto">
      <div className="space-y-6 pb-6 max-w-7xl w-full mx-auto">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-[#ece883]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => navigate("/pacientes")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#ece883] mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al Hub de Pacientes
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <BedDouble className="w-8 h-8 text-[#ece883]" />
                Área de Hospitalización y Monitoreo
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Control activo de pacientes internados, tratamientos, camas y
                signos vitales.
              </p>
            </div>

            <button
              onClick={handleOpenAdmission}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors shadow-md shadow-[#ece883]/10 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Ingresar Paciente
            </button>
          </div>
        </div>

        {/* Mensaje de retroalimentación */}
        {feedback && (
          <div
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <span className="flex items-start gap-2">
              {feedback.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              {feedback.message}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold opacity-70 hover:opacity-100 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Tarjetas de Resumen Rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Pacientes Internados
              </p>
              <h3 className="text-xl font-bold text-white">
                {totalInternados}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Revisiones Pendientes
              </p>
              <h3 className="text-xl font-bold text-white">
                {revisionesPendientes}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                Camas Disponibles
              </p>
              <h3 className="text-xl font-bold text-white">
                {camasDisponibles} / {totalCamas}
              </h3>
            </div>
          </div>
        </div>

        {/* Mapa de camas */}
        <BedMap
          beds={bedMapItems}
          onOpenHospitalization={handleOpenDetailById}
          onAddBed={handleAddBed}
          onRemoveBed={handleRemoveBed}
          canRemoveBeds={beds.length > 1}
        />

        {/* Pestañas */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("activos")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "activos"
                ? "bg-slate-900 text-white border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            En cuidado activo
            <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px]">
              {totalInternados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("altas")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "altas"
                ? "bg-slate-900 text-white border border-slate-700"
                : "text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historial de altas
            <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px]">
              {totalAltas}
            </span>
          </button>
        </div>

        {activeTab === "activos" ? (
          /* Listado de Pacientes Hospitalizados */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
                Pacientes en Cuidado Activo
              </h2>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {totalInternados}{" "}
                {totalInternados === 1 ? "paciente" : "pacientes"}
              </span>
            </div>

            {activeViews.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
                <p className="text-sm text-slate-400 mb-2 font-medium">
                  No hay pacientes hospitalizados en este momento.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Puedes hospitalizar a un paciente desde el modal de consulta
                  médica (botón "Hospitalizar") o manualmente con el botón
                  "Ingresar Paciente".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeViews.map((item) => (
                  <div
                    key={item.hospitalization.id}
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">
                          {item.patient.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          {item.bed}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                            item.reviewOverdue
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Propietario:{" "}
                        <span className="text-slate-200">
                          {item.owner?.name || "Sin propietario"}
                        </span>{" "}
                        ({formatSpeciesAndBreed(item.patient)})
                      </p>
                      <p className="text-sm text-slate-300 font-medium italic">
                        Motivo: "{item.reason}"
                      </p>
                      {item.diagnosis && (
                        <p className="text-xs text-slate-400">
                          Diagnóstico:{" "}
                          <span className="text-slate-200">
                            {item.diagnosis}
                          </span>
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Ingreso: {formatTimestamp(item.admissionDate)}</span>
                        <span>
                          Peso:{" "}
                          {item.hospitalization.weightAtAdmission != null
                            ? `${item.hospitalization.weightAtAdmission} kg`
                            : "No registrado"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 ${
                            item.reviewOverdue ? "text-red-400" : ""
                          }`}
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          Próxima revisión:{" "}
                          {item.nextReviewAt
                            ? formatDateTime(item.nextReviewAt)
                            : "Sin programar"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto shrink-0">
                      <button
                        onClick={() =>
                          handleOpenDetail(item.hospitalization, item.patient)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5" /> Ficha
                      </button>
                      <button
                        onClick={() =>
                          handleRegistrarEvolucion(
                            item.hospitalization,
                            item.patient,
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" /> Evolución
                      </button>
                      <button
                        onClick={() =>
                          handleOpenMedication(
                            item.hospitalization,
                            item.patient,
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Pill className="w-3.5 h-3.5" /> Medicación / consumo
                      </button>
                      <button
                        onClick={() => handleSendReviewReminder(item)}
                        disabled={!item.owner?.phone || !item.nextReviewAt}
                        title={
                          !item.nextReviewAt
                            ? "Programa una próxima revisión para enviar el recordatorio"
                            : item.owner?.phone
                              ? "Enviar recordatorio por WhatsApp"
                              : "El propietario no tiene teléfono registrado"
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-emerald-300 border border-emerald-500/20 disabled:border-slate-800 text-xs font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Recordar
                      </button>
                      <button
                        onClick={() =>
                          handleDarDeAlta(item.hospitalization, item.patient)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Alta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Historial de altas */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#ece883]">
                Historial de Altas
              </h2>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {totalAltas} {totalAltas === 1 ? "alta" : "altas"}
              </span>
            </div>

            {dischargedViews.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-1" />
                <p className="text-sm text-slate-400 font-medium">
                  Aún no hay altas registradas.
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Cuando des de alta a un paciente internado, su resumen
                  aparecerá en esta sección.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dischargedViews.map(({ hospitalization, patient }) => {
                  const owner = getOwner(patient.ownerId);
                  const summary = hospitalization.dischargeSummary;

                  return (
                    <div
                      key={hospitalization.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {patient.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                            {hospitalization.bed || "Sin cama"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            Alta
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Propietario:{" "}
                          <span className="text-slate-200">
                            {owner?.name || "Sin propietario"}
                          </span>{" "}
                          ({formatSpeciesAndBreed(patient)})
                        </p>
                        <p className="text-sm text-slate-300">
                          <span className="text-slate-500">Diagnóstico de alta: </span>
                          {summary?.diagnosis || "No registrado"}
                        </p>
                        {summary?.indications && (
                          <p className="text-xs text-slate-400">
                            <span className="text-slate-500">Indicaciones: </span>
                            {summary.indications}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Alta:{" "}
                            {formatTimestamp(
                              hospitalization.dischargedAt ??
                                hospitalization.admittedAt,
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5" />
                            Próximo control:{" "}
                            {formatDateOnly(summary?.nextControlAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto shrink-0">
                        <button
                          onClick={() =>
                            handleOpenDetail(hospitalization, patient)
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Ver resumen
                        </button>
                        <button
                          onClick={() =>
                            handleSendDischargeReminder(
                              hospitalization,
                              patient,
                              owner,
                            )
                          }
                          disabled={!owner?.phone}
                          title={
                            owner?.phone
                              ? "Enviar indicaciones por WhatsApp"
                              : "El propietario no tiene teléfono registrado"
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-slate-800 disabled:text-slate-500 text-emerald-300 border border-emerald-500/20 disabled:border-slate-800 text-xs font-semibold transition-colors disabled:cursor-not-allowed cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Enviar
                          indicaciones
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Modal de Admisión */}
      <AdmissionFormModal
        isOpen={showAdmissionModal}
        patients={patientsParaIngreso}
        getOwner={getOwner}
        availableBeds={availableBeds}
        onAdmit={handleAdmit}
        onClose={() => setShowAdmissionModal(false)}
      />

      {/* Modal de Registrar Evolución */}
      <EvolutionFormModal
        isOpen={showEvolutionModal}
        patient={selectedPatient}
        onSave={handleSaveEvolution}
        onClose={() => {
          setShowEvolutionModal(false);
          setSelectedHospitalizationId(null);
          setSelectedPatient(null);
        }}
      />

      {/* Modal de Confirmar Alta */}
      <DischargeConfirmModal
        isOpen={showDischargeModal}
        patient={selectedPatient}
        hospitalization={selectedHospitalization}
        onConfirm={handleConfirmDischarge}
        onCancel={() => {
          setShowDischargeModal(false);
          setSelectedHospitalizationId(null);
          setSelectedPatient(null);
        }}
      />

      {/* Modal de medicación y consumos */}
      <MedicationAdministrationModal
        key={editingMedication?.id ?? "new-medication"}
        isOpen={showMedicationModal}
        patient={selectedPatient}
        products={products}
        initial={editingMedication}
        onAdminister={handleSaveMedication}
        onClose={() => {
          const wasEditing = Boolean(editingMedication);
          setShowMedicationModal(false);
          setEditingMedication(null);
          if (!wasEditing) {
            setSelectedHospitalizationId(null);
            setSelectedPatient(null);
          }
        }}
      />

      {/* Modal de Ficha / Timeline */}
      <HospitalizationDetailModal
        isOpen={showDetailModal}
        patient={selectedPatient}
        owner={
          selectedPatient ? getOwner(selectedPatient.ownerId) : undefined
        }
        hospitalization={selectedHospitalization}
        onEditMedication={handleEditMedication}
        onDeleteMedication={handleDeleteMedication}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedHospitalizationId(null);
          setSelectedPatient(null);
        }}
      />
    </div>
  );
};

export default HospitalizationView;
