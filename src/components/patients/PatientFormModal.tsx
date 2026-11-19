import { useState } from "react";
import { Save, UserPlus, Users, X } from "lucide-react";
import { DateInput } from "../common/DateInput";
import { usePatients } from "../../hooks/usePatients";
import {
  ESPECIES_MASCOTA,
  ESTADOS_VACUNA,
  GENEROS,
  type EspecieMascota,
  type EstadoVacuna,
  type Genero,
} from "../../constants/appConstants";
import type { Patient } from "../../types/patient";

interface PatientFormModalProps {
  /** Si viene un paciente, el formulario entra en modo edición. */
  patient?: Patient | null;
  onClose: () => void;
  onSaved?: (patient: Patient) => void;
  isReadOnly?: boolean;
}

const SPECIES_LABELS: Record<EspecieMascota, string> = {
  perro: "Perro",
  gato: "Gato",
  exoticos: "Exótico / Otro",
};

const VACCINE_LABELS: Record<EstadoVacuna, string> = {
  al_dia: "Al día",
  pendiente: "Pendiente",
  atrasada: "Atrasada",
};

const fieldClass =
  "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ece883]/60";
const labelClass = "text-xs font-semibold text-slate-400";

export const PatientFormModal = ({
  patient,
  onClose,
  onSaved,
  isReadOnly = false,
}: PatientFormModalProps) => {
  const {
    owners,
    getOwner,
    getOwnerByPhone,
    createOwner,
    updateOwner,
    createPatient,
    updatePatient,
  } = usePatients();

  const isEditing = Boolean(patient);
  // Al crear, se preselecciona el primer propietario para no guardar datos vacíos.
  const initialOwner = patient ? getOwner(patient.ownerId) : owners[0];
  const [ownerMode, setOwnerMode] = useState<"existing" | "new">(
    initialOwner || owners.length > 0 ? "existing" : "new",
  );
  const [ownerId, setOwnerId] = useState(
    initialOwner?.id ?? owners[0]?.id ?? "",
  );
  const [ownerName, setOwnerName] = useState(initialOwner?.name ?? "");
  const [ownerPhone, setOwnerPhone] = useState(initialOwner?.phone ?? "");
  const [ownerEmail, setOwnerEmail] = useState(initialOwner?.email ?? "");

  const [name, setName] = useState(patient?.name ?? "");
  const [species, setSpecies] = useState<EspecieMascota>(
    patient?.species ?? "perro",
  );
  const [breed, setBreed] = useState(patient?.breed ?? "");
  const [gender, setGender] = useState<Genero>(patient?.gender ?? "macho");
  const [birthDate, setBirthDate] = useState(patient?.birthDate ?? "");
  const [age, setAge] = useState(patient?.age ?? "");
  const [microchip, setMicrochip] = useState(patient?.microchip ?? "");
  const [vaccineStatus, setVaccineStatus] = useState<EstadoVacuna>(
    patient?.vaccineStatus ?? "pendiente",
  );
  const [conditions, setConditions] = useState(patient?.conditions ?? "");
  const [error, setError] = useState("");

  const handleSelectOwner = (value: string) => {
    setOwnerId(value);
    const owner = owners.find((item) => item.id === value);
    setOwnerName(owner?.name ?? "");
    setOwnerPhone(owner?.phone ?? "");
    setOwnerEmail(owner?.email ?? "");
  };

  const handleOwnerModeChange = (mode: "existing" | "new") => {
    if (mode === ownerMode) return;
    setOwnerMode(mode);
    setError("");

    if (mode === "new") {
      // Se limpian los datos del propietario seleccionado para no duplicarlo.
      setOwnerId("");
      setOwnerName("");
      setOwnerPhone("");
      setOwnerEmail("");
      return;
    }

    const fallback = owners.find((item) => item.id === ownerId) ?? owners[0];
    if (fallback) {
      setOwnerId(fallback.id);
      setOwnerName(fallback.name);
      setOwnerPhone(fallback.phone);
      setOwnerEmail(fallback.email ?? "");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly) return;

    if (!name.trim()) {
      setError("Ingresa el nombre del paciente.");
      return;
    }

    // ---------- Propietario ----------
    let resolvedOwnerId = ownerId;

    if (ownerMode === "new") {
      if (!ownerName.trim() || !ownerPhone.trim()) {
        setError("Ingresa nombre y teléfono del propietario.");
        return;
      }

      const existing = getOwnerByPhone(ownerPhone.trim());
      if (existing) {
        setError(
          "Ya existe un propietario con ese teléfono. Selecciónalo en la lista.",
        );
        return;
      }

      const owner = createOwner({
        name: ownerName.trim(),
        phone: ownerPhone.trim(),
        email: ownerEmail.trim() || undefined,
      });
      resolvedOwnerId = owner.id;
    } else {
      if (!resolvedOwnerId) {
        setError("Selecciona un propietario.");
        return;
      }

      if (!ownerName.trim() || !ownerPhone.trim()) {
        setError("Ingresa nombre y teléfono del propietario.");
        return;
      }

      const owner = getOwner(resolvedOwnerId);
      if (owner) {
        const phoneOwner = getOwnerByPhone(ownerPhone.trim());
        if (
          phoneOwner &&
          phoneOwner.id !== owner.id
        ) {
          setError("Ese teléfono ya está registrado por otro propietario.");
          return;
        }

        if (
          owner.name !== ownerName.trim() ||
          owner.phone !== ownerPhone.trim() ||
          (owner.email ?? "") !== ownerEmail.trim()
        ) {
          updateOwner(owner.id, {
            name: ownerName.trim(),
            phone: ownerPhone.trim(),
            email: ownerEmail.trim() || undefined,
          });
        }
      }
    }

    // ---------- Paciente ----------
    const data = {
      name: name.trim(),
      species,
      breed: breed.trim() || undefined,
      gender,
      birthDate: birthDate || undefined,
      age: age.trim() || undefined,
      microchip: microchip.trim() || undefined,
      vaccineStatus,
      conditions: conditions.trim() || undefined,
      ownerId: resolvedOwnerId,
    };

    if (patient) {
      updatePatient(patient.id, data);
      onSaved?.({ ...patient, ...data });
    } else {
      const created = createPatient(data);
      onSaved?.(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#ece883]/10 text-[#ece883] border border-[#ece883]/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isEditing ? "Editar ficha" : "Nueva ficha de paciente"}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Datos del paciente y su propietario.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Propietario */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <Users className="w-4 h-4" /> Propietario
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOwnerModeChange("existing")}
                disabled={isReadOnly}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  ownerMode === "existing"
                    ? "bg-[#ece883] text-slate-950"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                Propietario existente
              </button>
              <button
                type="button"
                onClick={() => handleOwnerModeChange("new")}
                disabled={isReadOnly}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  ownerMode === "new"
                    ? "bg-[#ece883] text-slate-950"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                Nuevo propietario
              </button>
            </div>

            {ownerMode === "existing" && (
              <label className="block space-y-1.5">
                <span className={labelClass}>Seleccionar propietario</span>
                <select
                  value={ownerId}
                  onChange={(event) => handleSelectOwner(event.target.value)}
                  className={fieldClass}
                >
                  <option value="">Selecciona un propietario...</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} · {owner.phone}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1.5">
                <span className={labelClass}>Nombre</span>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Nombre y apellido"
                  className={fieldClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Teléfono</span>
                <input
                  type="tel"
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(event.target.value)}
                  placeholder="+56 9 1234 5678"
                  className={fieldClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Email (opcional)</span>
                <input
                  type="email"
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  placeholder="correo@ejemplo.cl"
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          {/* Paciente */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#ece883] flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Paciente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className={labelClass}>Nombre</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nombre de la mascota"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Especie</span>
                <select
                  value={species}
                  onChange={(event) =>
                    setSpecies(event.target.value as EspecieMascota)
                  }
                  className={fieldClass}
                >
                  {ESPECIES_MASCOTA.map((option) => (
                    <option key={option} value={option}>
                      {SPECIES_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Raza (opcional)</span>
                <input
                  type="text"
                  value={breed}
                  onChange={(event) => setBreed(event.target.value)}
                  placeholder="Ej: Mestizo, Labrador"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Sexo</span>
                <select
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value as Genero)
                  }
                  className={fieldClass}
                >
                  {GENEROS.map((option) => (
                    <option key={option} value={option}>
                      {option === "macho" ? "Macho" : "Hembra"}
                    </option>
                  ))}
                </select>
              </label>

              <DateInput
                value={birthDate}
                onChange={setBirthDate}
                label={
                  <span className={labelClass}>
                    Fecha de nacimiento (opcional)
                  </span>
                }
                labelClassName="block mb-1.5"
                className={fieldClass}
              />

              <label className="space-y-1.5">
                <span className={labelClass}>
                  Edad registrada (opcional)
                </span>
                <input
                  type="text"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="Ej: 3 años y 2 meses"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Microchip (opcional)</span>
                <input
                  type="text"
                  value={microchip}
                  onChange={(event) => setMicrochip(event.target.value)}
                  placeholder="Número de microchip"
                  className={fieldClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className={labelClass}>Estado de vacunas</span>
                <select
                  value={vaccineStatus}
                  onChange={(event) =>
                    setVaccineStatus(event.target.value as EstadoVacuna)
                  }
                  className={fieldClass}
                >
                  {ESTADOS_VACUNA.map((option) => (
                    <option key={option} value={option}>
                      {VACCINE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="sm:col-span-2 space-y-1.5">
                <span className={labelClass}>
                  Condiciones o antecedentes (opcional)
                </span>
                <textarea
                  value={conditions}
                  onChange={(event) => setConditions(event.target.value)}
                  rows={2}
                  placeholder="Alergias, enfermedades crónicas, etc."
                  className={fieldClass}
                />
              </label>
            </div>
          </section>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isReadOnly}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isEditing ? "Guardar cambios" : "Crear ficha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;
