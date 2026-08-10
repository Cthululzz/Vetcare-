// src/components/schedule/AppointmentForm.tsx
import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  Phone,
  Mail,
  Heart,
  Mars,
  Venus,
  GitCommit,
} from "lucide-react";
import { formatDateLatam } from "../appointmentUtils";
import {
  ESPECIES_MASCOTA,
  TIPOS_CITA,
  SUCURSALES,
  DOCTORES,
} from "../appointmentConstants";
import { FormField } from "../FormField";

interface AppointmentFormProps {
  onSaveAppointment: (appointmentData: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

const INITIAL_FORM_STATE = {
  propietario: "",
  telefono: "",
  email: "",
  paciente: "",
  raza: "",
  tipoMascota: "Perro",
  genero: "Macho",
  sucursal: SUCURSALES[0],
  doctor: DOCTORES[0],
  fecha: "",
  hora: "",
  motivo: "",
  tipo: "Control",
};

export const AppointmentForm = ({
  onSaveAppointment,
  onCancel,
  initialData,
}: AppointmentFormProps) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isPreselectedDate = initialData?.fecha && !initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAppointment(formData);
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
          {initialData?.id
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
          {initialData?.id
            ? "Editar Cita Médica"
            : "Registrar Nueva Cita Médica"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isPreselectedDate
            ? `Agendando para el día ${formatDateLatam(formData.fecha)}`
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
                name="propietario"
                value={formData.propietario}
                onChange={handleChange}
                placeholder="Ej. Carlos Mendoza"
                icon={<User className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
              <FormField
                label="Teléfono de Contacto"
                name="telefono"
                type="tel"
                required={true}
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. +56912345678"
                icon={<Phone className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
              <FormField
                label="Correo Electrónico (Opcional)"
                name="email"
                type="email"
                required={false}
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej. correo@ejemplo.com"
                icon={<Mail className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />
            </div>

            {/* Columna Derecha: Paciente */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-[#ece883] uppercase tracking-wider mb-1">
                Datos del Paciente
              </h3>
              <FormField
                label="Nombre del Paciente"
                name="paciente"
                value={formData.paciente}
                onChange={handleChange}
                placeholder="Ej. Max"
                icon={<Heart className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />

              {/* Raza ocupando el ancho completo de la fila para mantener simetría visual */}
              <FormField
                label="Raza"
                name="raza"
                value={formData.raza}
                onChange={handleChange}
                placeholder="Ej. Golden Retriever"
                required={false}
                icon={<GitCommit className="w-4 h-4" />}
                fieldClassName={fieldClassName}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Especie
                  </label>
                  <select
                    name="tipoMascota"
                    value={formData.tipoMascota}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-[#ece883]"
                  >
                    {ESPECIES_MASCOTA.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Género
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, genero: "Macho" }))
                      }
                      className={`h-[46px] rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        formData.genero === "Macho"
                          ? "bg-blue-950/80 border-blue-500 text-blue-400"
                          : "bg-slate-950 border-slate-800 text-slate-600"
                      }`}
                    >
                      <Mars className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({ ...p, genero: "Hembra" }))
                      }
                      className={`h-[46px] rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        formData.genero === "Hembra"
                          ? "bg-pink-950/80 border-pink-500 text-pink-400"
                          : "bg-slate-950 border-slate-800 text-slate-600"
                      }`}
                    >
                      <Venus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Tipo de Cita
                  </label>
                  <select
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Sucursal
                  </label>
                  <select
                    name="sucursal"
                    value={formData.sucursal}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    {SUCURSALES.map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="bg-slate-900 text-white"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Doctor Asignado
                  </label>
                  <select
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    {DOCTORES.map((d) => (
                      <option
                        key={d}
                        value={d}
                        className="bg-slate-900 text-white"
                      >
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <FormField
                  label="Hora de la Cita"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  placeholder="Ej. 10:30 hrs"
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
                    {formatDateLatam(formData.fecha)}
                  </span>
                </div>
              ) : (
                initialData?.id && (
                  <FormField
                    label="Modificar Fecha"
                    name="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={handleChange}
                    icon={<Calendar className="w-4 h-4" />}
                    fieldClassName={`${fieldClassName} [color-scheme:dark]`}
                  />
                )
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Motivo de la Cita
                </label>
                <div className="border border-slate-800 rounded-xl bg-slate-950">
                  <div className="flex items-start">
                    <span className="pt-3.5 pl-3.5 text-slate-500">
                      <FileText className="w-4 h-4" />
                    </span>
                    <textarea
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
            {initialData?.id ? "Guardar Cambios" : "Guardar Cita"}
          </button>
        </div>
      </form>
    </div>
  );
};
