import { useMemo, useState } from "react";
import { useBranchScope } from "../../../context/branchScope";
import { usePatients } from "../../../hooks/usePatients";
import { usePermissions } from "../../../hooks/usePermissions";
import { LinkClientToBranchModal } from "../../patients/LinkClientToBranchModal";
import { necesitaVinculo } from "../../../utils/clientMatching";
import type { ChangeEvent, FormEvent } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import { formatDateShort, normalizarHora } from "../../../utils/dateUtils";
import type { Patient } from "../../../types/patient";
import { DateInput } from "../../common/DateInput";
import {
  ESPECIES_MASCOTA,
  TIPOS_CITA,
  SUCURSALES,
  DOCTORES,
  type EspecieMascota,
  type Genero,
  type TipoCita,
  type DoctorId,
  type SucursalId,
} from "../../../constants/appConstants";
import { FormField } from "../FormField";
import {
  buildPetOptionLabel,
  NEW_PATIENT_OPTION,
} from "../../../utils/patientSelection";
import { PetInfoSection } from "./PetInfoSection";

// ============================================
// TIPOS
// ============================================

/**
 * Datos completos que el formulario devuelve al padre
 * El padre se encarga de crear/obtener dueño, paciente y cita
 */
export interface AppointmentFormData {
  // Datos de dueño
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  /** Dueño detectado en otra sucursal y aceptado para vincular al guardar. */
  ownerIdVinculado?: string;

  // Datos de paciente
  patientName: string;
  /** Mascota existente elegida en el desplegable del dueño. */
  patientId?: string;
  /** El usuario eligió "Agregar nuevo paciente" aunque el nombre se repita. */
  createNewPatient?: boolean;
  species: EspecieMascota;
  breed?: string;
  gender: Genero;

  // Datos de cita
  doctorId: DoctorId;
  sucursalId: SucursalId;
  fecha: string;
  hora: string;
  motivo: string;
  tipo: TipoCita;
  alergiasNotas?: string;
}

interface AppointmentFormProps {
  onSaveAppointment: (data: AppointmentFormData) => string | null | void;
  onCancel?: () => void;
  initialData?: Partial<AppointmentFormData>;
}

// ============================================
// ESTADO INICIAL
// ============================================

const INITIAL_FORM_STATE: AppointmentFormData = {
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  patientName: "",
  species: ESPECIES_MASCOTA[0],
  breed: "",
  gender: "macho",
  doctorId: DOCTORES[0].id,
  sucursalId: SUCURSALES[0].id,
  fecha: "",
  hora: "",
  motivo: "",
  tipo: TIPOS_CITA[0].value,
  alergiasNotas: "",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const AppointmentForm = ({
  onSaveAppointment,
  onCancel,
  initialData,
}: AppointmentFormProps) => {
  const { activeBranch, writeScope } = useBranchScope();
  const { getOwner, getOwnerForAppointment, getPatientsByOwner, findCoincidenciasClientes } = usePatients();
  const { canManagePatients } = usePermissions();
  const [formData, setFormData] = useState<AppointmentFormData>(() => ({
    ...INITIAL_FORM_STATE,
    ...initialData,
    sucursalId: initialData?.sucursalId ?? writeScope().sucursalId,
  }));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [avisoDescartado, setAvisoDescartado] = useState(false);

  const isPreselectedDate = Boolean(
    initialData?.fecha && !initialData?.patientName,
  );
  const isEditing = Boolean(initialData?.patientName);
  const sucursalesDisponibles =
    activeBranch === "all"
      ? SUCURSALES
      : SUCURSALES.filter((sucursal) => sucursal.id === activeBranch);

  const duenoResuelto = getOwnerForAppointment(
    formData.ownerPhone,
    formData.ownerName,
  );
  const mascotasDelDueno = duenoResuelto
    ? getPatientsByOwner(duenoResuelto.id).filter((p) => p.isActive)
    : [];

  const opcionesPacientes = mascotasDelDueno.map((paciente) => ({
    id: paciente.id,
    label: buildPetOptionLabel(paciente, mascotasDelDueno, duenoResuelto),
  }));

  const coincidencias = useMemo(
    () =>
      findCoincidenciasClientes({
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        petName: formData.patientName,
        petBreed: formData.breed,
        petSpecies: formData.species,
      }).filter((coincidencia) =>
        necesitaVinculo(coincidencia.owner, formData.sucursalId),
      ),
    [
      findCoincidenciasClientes,
      formData.ownerName,
      formData.ownerPhone,
      formData.ownerEmail,
      formData.patientName,
      formData.breed,
      formData.species,
      formData.sucursalId,
    ],
  );
  const mostrarAvisoVinculo =
    coincidencias.length > 0 &&
    !avisoDescartado &&
    !formData.ownerIdVinculado &&
    !isSubmitted;

  const candidataAutomatica = mascotasDelDueno.find(
    (p) =>
      p.name.trim().toLowerCase() === formData.patientName.trim().toLowerCase(),
  );
  const seleccionPaciente = formData.createNewPatient
    ? NEW_PATIENT_OPTION
    : (formData.patientId ?? candidataAutomatica?.id ?? NEW_PATIENT_OPTION);

  /** Carga en el formulario la mascota elegida y los datos de su dueño. */
  const aplicarMascota = (
    mascota: Patient,
    estado: AppointmentFormData,
  ): AppointmentFormData => {
    const dueno = getOwner(mascota.ownerId);
    return {
      ...estado,
      patientId: mascota.id,
      createNewPatient: false,
      patientName: mascota.name,
      species: mascota.species,
      breed: mascota.breed ?? "",
      gender: mascota.gender,
      ownerName: dueno?.name ?? estado.ownerName,
      ownerPhone: dueno?.phone ?? estado.ownerPhone,
      ownerEmail: dueno?.email ?? "",
    };
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setAvisoDescartado(false);
    setFormData((prev) => {
      let siguiente: AppointmentFormData = { ...prev, [name]: value };

      const duenoAnterior = getOwnerForAppointment(
        prev.ownerPhone,
        prev.ownerName,
      );
      const duenoNuevo = getOwnerForAppointment(
        siguiente.ownerPhone,
        siguiente.ownerName,
      );

      if (name === "ownerName" || name === "ownerPhone") {
        // Si el dueño cambió (o dejó de existir), el formulario vuelve a cero:
        // no se arrastra ninguna mascota del cliente anterior.
        if (duenoNuevo?.id !== duenoAnterior?.id) {
          siguiente.patientId = undefined;
          siguiente.createNewPatient = undefined;
          siguiente.patientName = "";
          siguiente.species = ESPECIES_MASCOTA[0];
          siguiente.breed = "";
          siguiente.gender = "macho";
        }
        siguiente.ownerEmail = duenoNuevo?.email ?? "";
        if (duenoNuevo && !siguiente.ownerPhone.trim()) {
          siguiente.ownerPhone = duenoNuevo.phone;
        }
      }

      // Al escribir el nombre de la mascota se autocompleta si coincide con una
      // de las mascotas DEL DUEÑO ACTUAL. Si no hay dueño reconocido, no hay
      // nada que autocompletar y el campo queda libre para registrar una nueva.
      if (name === "patientName") {
        const nombre = value.trim().toLowerCase();
        const mascotas = duenoNuevo
          ? getPatientsByOwner(duenoNuevo.id).filter((p) => p.isActive)
          : [];
        const coincidencias = nombre
          ? mascotas.filter(
              (p) => p.name.trim().toLowerCase() === nombre,
            )
          : [];

        if (coincidencias.length === 1) {
          siguiente = aplicarMascota(coincidencias[0], siguiente);
        } else {
          siguiente.patientId = undefined;
          siguiente.createNewPatient = true;
        }
      } else if (name === "species" || name === "breed") {
        // Modificar los datos clínicos implica registrar una mascota nueva.
        siguiente.patientId = undefined;
        siguiente.createNewPatient = true;
      }

      return siguiente;
    });
  };

  const handleSelectPatient = (value: string) => {
    if (value === NEW_PATIENT_OPTION) {
      setFormData((prev) => ({
        ...prev,
        patientId: undefined,
        createNewPatient: true,
      }));
      return;
    }

    const mascota = mascotasDelDueno.find((p) => p.id === value);
    if (!mascota) return;

    setFormData((prev) => aplicarMascota(mascota, prev));
  };

  /** Acepta la ficha existente; el vínculo se persiste al guardar la cita. */
  const handleVincular = (ownerId: string, mascotaId?: string) => {
    const coincidencia = coincidencias.find((c) => c.owner.id === ownerId);
    if (!coincidencia) return;

    setFormData((prev) => {
      const base: AppointmentFormData = {
        ...prev,
        ownerIdVinculado: ownerId,
        ownerName: coincidencia.owner.name,
        ownerPhone: coincidencia.owner.phone,
        ownerEmail: coincidencia.owner.email ?? "",
      };
      return mascotaId && coincidencia.mascotaCoincidente
        ? aplicarMascota(coincidencia.mascotaCoincidente, base)
        : { ...base, patientId: undefined, createNewPatient: true };
    });
    setAvisoDescartado(true);
    setSubmitError("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const hora = normalizarHora(formData.hora);
    if (!hora) {
      setSubmitError("Ingresa la hora en formato HH:MM, por ejemplo 10:30.");
      return;
    }
    const message = onSaveAppointment({ ...formData, hora });
    if (message) {
      setSubmitError(message);
      return;
    }
    setSubmitError("");
    setIsSubmitted(true);
  };

  const fieldClassName =
    "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ece883] focus:ring-1 focus:ring-[#ece883]/30 transition-all";

  if (isSubmitted) {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          {initialData?.patientName
            ? "¡Cita actualizada con éxito!"
            : "¡Cita agendada con éxito!"}
        </h3>
        <p className="text-sm text-slate-400">
          Los cambios se han guardado correctamente en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-3 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-[#ece883]" />
          {initialData?.patientName
            ? "Editar Cita Médica"
            : "Registrar Nueva Cita Médica"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isPreselectedDate && formData.fecha
            ? `Agendando para el día ${formatDateShort(formData.fecha)}`
            : "Complete los datos del paciente, tipo de atención y detalles médicos."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Columna Izquierda: Propietario */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[#ece883] uppercase tracking-wider mb-1">
                Datos del Propietario
              </h3>
              <FormField
                label="Nombre del Propietario"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Ej. Carlos Mendoza"
                icon={<User className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
              <FormField
                label="Teléfono de Contacto"
                name="ownerPhone"
                type="tel"
                required={true}
                value={formData.ownerPhone}
                onChange={handleChange}
                placeholder="Ej. +56912345678"
                icon={<Phone className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
              <FormField
                label="Correo Electrónico (Opcional)"
                name="ownerEmail"
                type="email"
                required={false}
                value={formData.ownerEmail || ""}
                onChange={handleChange}
                placeholder="Ej. correo@ejemplo.com"
                icon={<Mail className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
            </div>

            {/* Columna Derecha: Paciente (Modularizado con PetInfoSection) */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[#ece883] uppercase tracking-wider mb-1">
                Datos del Paciente
              </h3>
              <PetInfoSection
                key={duenoResuelto?.id ?? "sin-dueno"}
                formData={formData}
                onChange={handleChange}
                setFormData={setFormData}
                opcionesPacientes={opcionesPacientes}
                seleccionPaciente={seleccionPaciente}
                onSelectPatient={handleSelectPatient}
                mostrarDesplegable={Boolean(duenoResuelto)}
              />
            </div>
          </div>

          {/* Detalles de la Cita */}
          <div className="border-t border-slate-800/80 pt-3.5 mt-3.5">
            <h3 className="text-xs font-bold text-[#ece883] uppercase tracking-wider mb-3">
              Detalles de la Cita
            </h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="cita-tipo"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                  >
                    Tipo de Cita
                  </label>
                  <select
                    id="cita-tipo"
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    {TIPOS_CITA.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="bg-slate-900 text-white"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="cita-sucursal"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                  >
                    Sucursal
                  </label>
                  <select
                    id="cita-sucursal"
                    name="sucursalId"
                    value={formData.sucursalId}
                    onChange={handleChange}
                    disabled={isEditing}
                    className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {sucursalesDisponibles.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="bg-slate-900 text-white"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {isEditing && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      La sucursal de una cita existente no se modifica.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="cita-doctor"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                  >
                    Doctor Asignado
                  </label>
                  <select
                    id="cita-doctor"
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    {DOCTORES.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        className="bg-slate-900 text-white"
                      >
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <FormField
                  label="Hora de la Cita"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  type="time"
                  icon={<Clock className="w-4 h-4" />}
                  fieldClassName={fieldClassName}
                />
              </div>

              {isPreselectedDate ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ece883]" /> Fecha
                    seleccionada:
                  </span>
                  <span className="text-[#ece883] font-bold">
                    {formatDateShort(formData.fecha)}
                  </span>
                </div>
              ) : (
                initialData?.patientName && (
                  <div>
                    <label
                      htmlFor="cita-fecha"
                      className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                    >
                      Modificar Fecha
                    </label>
                    <DateInput
                      id="cita-fecha"
                      name="fecha"
                      value={formData.fecha}
                      onChange={(isoDate) =>
                        setFormData((prev) => ({ ...prev, fecha: isoDate }))
                      }
                      required
                      icon={<Calendar className="w-4 h-4" />}
                      className={fieldClassName}
                    />
                  </div>
                )
              )}

              <div>
                <label
                  htmlFor="cita-motivo"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
                >
                  Motivo de la Cita
                </label>
                <div className="border border-slate-800 rounded-xl bg-slate-950">
                  <div className="flex items-start">
                    <span className="pt-3.5 pl-3.5 text-slate-500">
                      <FileText className="w-4 h-4" />
                    </span>
                    <textarea
                      id="cita-motivo"
                      name="motivo"
                      rows={2}
                      required
                      value={formData.motivo}
                      onChange={handleChange}
                      placeholder="Describa brevemente el motivo..."
                      className="w-full bg-transparent py-3 pl-3 pr-4 text-sm text-white focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {submitError && (
            <p className="mr-auto text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df73] text-slate-950 text-sm font-bold transition-colors cursor-pointer shadow-lg shadow-[#ece883]/10"
          >
            {initialData?.patientName ? "Guardar Cambios" : "Guardar Cita"}
          </button>
        </div>
      </form>

      {mostrarAvisoVinculo && (
        <LinkClientToBranchModal
          coincidencias={coincidencias}
          sucursalDestino={formData.sucursalId}
          puedeVincular={canManagePatients}
          onVincular={handleVincular}
          onCancel={() => setAvisoDescartado(true)}
        />
      )}
    </div>
  );
};
