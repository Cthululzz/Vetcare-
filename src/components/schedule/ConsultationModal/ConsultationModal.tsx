// src/components/schedule/ConsultationModal/ConsultationModal.tsx
import { useState, useEffect } from "react";
import { Save, CheckCircle2, BedDouble } from "lucide-react";
import { getBadgeStyle, getPetIcon } from "../appointmentUtils";
import { ConsultationHeader } from "./ConsultationHeader";
import { ActionConfirmModal } from "./ConsultationModals";
import { usePatientProfiles } from "../../../hooks/usePatientProfiles";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: any;
  onSaveConsultation: (updatedData: any, shouldFinish?: boolean) => void;
  onHospitalize?: (cita: any) => void;
}

export const ConsultationModal = ({
  isOpen,
  onClose,
  cita,
  onSaveConsultation,
  onHospitalize,
}: ConsultationModalProps) => {
  const { getProfile, saveProfile } = usePatientProfiles();

  const [formData, setFormData] = useState({
    edad: "",
    peso: "",
    condicionesPrevias: "",
    recomendaciones: "",
    notas: "",
  });

  const [isHospitalizing, setIsHospitalizing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Verificamos si es primera vez comparando el historial guardado en localStorage
  const checkIfFirstTime = () => {
    if (!cita || !cita.paciente || !cita.propietario) return true;
    try {
      const savedAppointments = localStorage.getItem("vet_appointments");
      if (!savedAppointments) return true;
      const parsed: any[] = JSON.parse(savedAppointments);

      const normalizedPatient = cita.paciente.trim().toLowerCase();
      const normalizedOwner = cita.propietario.trim().toLowerCase();

      const historial = parsed.filter((app) => {
        const appPatient = (app.paciente || "").trim().toLowerCase();
        const appOwner = (app.propietario || "").trim().toLowerCase();
        return appPatient === normalizedPatient && appOwner === normalizedOwner;
      });

      return historial.length <= 1;
    } catch (e) {
      return true;
    }
  };

  const isFirstTime = checkIfFirstTime();

  useEffect(() => {
    if (cita) {
      // Intentamos cargar las condiciones previas desde el perfil persistente del paciente si existe
      const patientProfile = getProfile(cita.paciente, cita.propietario);
      const condicionesGuardadas = patientProfile
        ? patientProfile.condicionesPrevias
        : cita.condicionesPrevias || "";

      setFormData({
        edad: cita.edad || "",
        peso: cita.peso || "",
        condicionesPrevias: condicionesGuardadas,
        recomendaciones: cita.recomendaciones || "",
        notas: cita.notas || "",
      });
      setIsHospitalizing(false);
      setShowConfirmModal(false);
      setHasUnsavedChanges(false);
      setShowExitConfirmModal(false);
    }
  }, [cita]);

  if (!isOpen || !cita) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveOnly = (e: React.FormEvent) => {
    e.preventDefault();

    // Guardamos también en el perfil persistente del paciente las condiciones previas
    if (cita.paciente && cita.propietario) {
      saveProfile(
        cita.paciente,
        cita.propietario,
        formData.condicionesPrevias,
        {
          edad: formData.edad,
          peso: formData.peso,
        },
      );
    }

    onSaveConsultation({ ...cita, ...formData }, false);
    setHasUnsavedChanges(false);
  };

  const handleFinish = () => {
    // Guardamos en el perfil persistente antes de finalizar
    if (cita.paciente && cita.propietario) {
      saveProfile(
        cita.paciente,
        cita.propietario,
        formData.condicionesPrevias,
        {
          edad: formData.edad,
          peso: formData.peso,
        },
      );
    }

    onSaveConsultation({ ...cita, ...formData }, true);
    setHasUnsavedChanges(false);
  };

  const badgeStyle = getBadgeStyle(cita.tipo);

  // Verificamos si ya hay un perfil con condiciones previas guardadas
  const existingProfile = getProfile(cita.paciente, cita.propietario);
  const hasSavedConditions = Boolean(existingProfile?.condicionesPrevias);

  // Muestra el campo de condiciones si es primera vez O si ya tiene algo escrito previamente en su perfil
  const showCondicionesPrevias = isFirstTime || hasSavedConditions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-4xl bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          badgeStyle.includes("border-") ? badgeStyle : "border-slate-800"
        }`}
      >
        <ConsultationHeader
          tipo={cita.tipo}
          badgeStyle={badgeStyle}
          onCloseClick={() =>
            hasUnsavedChanges ? setShowExitConfirmModal(true) : onClose()
          }
        />

        <form
          onSubmit={handleSaveOnly}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">{cita.paciente}</h3>
              {getPetIcon(cita.tipoMascota || cita.tipo, cita.genero)}
            </div>

            <p className="text-xs text-slate-400">
              Propietario:{" "}
              <span className="text-slate-300 font-medium">
                {cita.propietario}
              </span>
              <span className="mx-2">•</span>
              Sucursal:{" "}
              <span className="text-slate-300 font-medium">
                {cita.sucursal}
              </span>
            </p>

            {cita.motivo && (
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  Motivo de la consulta
                </p>
                <p className="text-sm text-slate-200 italic bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/50">
                  "{cita.motivo}"
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Edad del Paciente
              </label>
              <input
                type="text"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                placeholder="Ej. 3 años y 2 meses"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="text"
                name="peso"
                value={formData.peso}
                onChange={handleChange}
                placeholder="Ej. 12.5 kg"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sección dinámica: Solo aparece si es su primera vez o si ya contiene información guardada en su perfil */}
          {showCondicionesPrevias && (
            <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl space-y-1">
              <label className="block text-xs font-semibold text-amber-400 mb-1">
                ⚠️ Condiciones Médicas Previas / Alergias (Información Crítica)
              </label>
              <textarea
                name="condicionesPrevias"
                rows={2}
                value={formData.condicionesPrevias}
                onChange={handleChange}
                placeholder="Ej. Alérgico a la penicilina, condición cardíaca leve..."
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas de la Consulta / Diagnóstico
            </label>
            <textarea
              name="notas"
              rows={3}
              value={formData.notas}
              onChange={handleChange}
              placeholder="Escribe las observaciones..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recomendaciones para el Propietario
            </label>
            <textarea
              name="recomendaciones"
              rows={2}
              value={formData.recomendaciones}
              onChange={handleChange}
              placeholder="Ej. Reposo absoluto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsHospitalizing(true);
                setShowConfirmModal(true);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isHospitalizing
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400 font-bold"
                  : "bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30"
              }`}
            >
              <BedDouble className="w-4 h-4" /> Hospitalizar
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

        <ActionConfirmModal
          show={showConfirmModal}
          title="Hospitalización seleccionada"
          description={`¿Deseas enviar a ${cita.paciente} al área de internación y monitoreo?`}
          confirmText="Aceptar"
          cancelText="Cancelar"
          onCancel={() => {
            setIsHospitalizing(false);
            setShowConfirmModal(false);
          }}
          onConfirm={() => {
            setShowConfirmModal(false);
            if (onHospitalize) {
              onHospitalize({
                ...cita,
                ...formData,
                fechaIngreso: new Date().toISOString(),
                estado: "Hospitalizado",
              });
            }
          }}
        />

        <ActionConfirmModal
          show={showExitConfirmModal}
          title="Cambios sin guardar"
          description="Tienes modificaciones pendientes que no han sido guardadas. ¿Qué deseas hacer?"
          confirmText="Guardar y salir"
          cancelText="Aceptar"
          borderColor="border-blue-500/40"
          iconBgColor="bg-blue-600/20 border-blue-500/40 text-blue-400"
          onCancel={() => {
            setShowExitConfirmModal(false);
            onClose();
          }}
          onConfirm={() => {
            if (cita.paciente && cita.propietario) {
              saveProfile(
                cita.paciente,
                cita.propietario,
                formData.condicionesPrevias,
                {
                  edad: formData.edad,
                  peso: formData.peso,
                },
              );
            }
            onSaveConsultation({ ...cita, ...formData }, false);
            setShowExitConfirmModal(false);
            onClose();
          }}
        />
      </div>
    </div>
  );
};
