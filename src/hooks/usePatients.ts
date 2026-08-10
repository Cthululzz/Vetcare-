// src/hooks/usePatients.ts
import { useState, useEffect } from "react";

export interface PatientRecord {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age: string;
  gender: string;
  ownerName: string;
  ownerPhone: string;
  vaccineStatus: string;
  nextAppointment: string;
  history: Array<{
    date: string;
    notes: string;
    weight: string;
    recommendations: string;
  }>;
}

const LOCAL_STORAGE_KEY = "vet_patients_directory";

export const usePatients = () => {
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error al cargar pacientes de localStorage", e);
      }
    }
    // Datos iniciales de ejemplo o vacío
    return [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  // Función clave que se ejecuta al FINALIZAR una consulta
  const registerOrUpdateFromConsultation = (consultationData: any) => {
    setPatients((prevPatients) => {
      const patientName = consultationData.paciente || consultationData.name;
      const ownerName =
        consultationData.propietario || consultationData.ownerName;

      // Buscar si ya existe una ficha con el mismo nombre y propietario
      const existingIndex = prevPatients.findIndex(
        (p) =>
          p.name.toLowerCase() === patientName?.toLowerCase() &&
          p.ownerName.toLowerCase() === ownerName?.toLowerCase(),
      );

      const newHistoryEntry = {
        date: new Date().toLocaleDateString(),
        notes: consultationData.notas || "Sin notas registradas",
        weight: consultationData.peso || "No registrado",
        recommendations: consultationData.recomendaciones || "Ninguna",
      };

      if (existingIndex >= 0) {
        // Si ya existe, actualizamos sus datos generales y añadimos la entrada al historial
        const updated = [...prevPatients];
        const current = updated[existingIndex];

        updated[existingIndex] = {
          ...current,
          age: consultationData.edad || current.age,
          gender: consultationData.genero || current.gender,
          vaccineStatus:
            consultationData.vaccineStatus || current.vaccineStatus,
          nextAppointment: consultationData.fecha || current.nextAppointment,
          history: [newHistoryEntry, ...current.history], // Añadimos al inicio del historial
        };
        return updated;
      } else {
        // Si es su primera vez, creamos la ficha oficial automáticamente
        const newPatient: PatientRecord = {
          id: consultationData.pacienteId || Date.now().toString(),
          name: patientName || "Paciente sin nombre",
          species:
            consultationData.especie || consultationData.tipoMascota || "Perro",
          breed: consultationData.raza || "No especificada",
          age: consultationData.edad || "No especificada",
          gender: consultationData.genero || "Macho",
          ownerName: ownerName || "Sin propietario",
          ownerPhone: consultationData.telefono || "Sin teléfono",
          vaccineStatus: "Al día",
          nextAppointment: consultationData.fecha || "Pendiente",
          history: [newHistoryEntry],
        };
        return [...prevPatients, newPatient];
      }
    });
  };

  // Función para eliminar un paciente por su ID
  const deletePatient = (id: string) => {
    setPatients((prevPatients) => prevPatients.filter((p) => p.id !== id));
  };

  return {
    patients,
    registerOrUpdateFromConsultation,
    deletePatient,
  };
};
