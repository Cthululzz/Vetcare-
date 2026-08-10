// src/hooks/useAppointments.ts
import { useState, useEffect } from "react";
import type { Appointment } from "../types/appointment";
import { sortCitasByHour } from "../components/schedule/appointmentUtils";
import { getLocalTodayStr } from "../utils/dateUtils";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem("vet_appointments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("vet_appointments", JSON.stringify(appointments));
  }, [appointments]);

  const saveAppointment = (appointmentData: any) => {
    setAppointments((prev) => {
      const index = prev.findIndex(
        (app) => String(app.id) === String(appointmentData.id),
      );

      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...appointmentData,
        };
        return updated;
      } else {
        const newAppointment: Appointment = {
          ...appointmentData,
          id: appointmentData.id
            ? String(appointmentData.id)
            : Date.now().toString(),
        };
        return [newAppointment, ...prev];
      }
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.filter((app) => String(app.id) !== String(id)),
    );
  };

  // Función para determinar si un paciente (por nombre de mascota y propietario) va por primera vez
  const isFirstTimePatient = (
    nombrePaciente: string,
    nombrePropietario: string,
  ): boolean => {
    if (!nombrePaciente || !nombrePropietario) return true;

    const normalizedPatient = nombrePaciente.trim().toLowerCase();
    const normalizedOwner = nombrePropietario.trim().toLowerCase();

    // Filtramos todas las citas que coincidan con la mascota y el dueño
    const historialPaciente = appointments.filter((app: any) => {
      const appPatient = (app.paciente || "").trim().toLowerCase();
      const appOwner = (app.propietario || "").trim().toLowerCase();
      return appPatient === normalizedPatient && appOwner === normalizedOwner;
    });

    // Si no tiene registros previos o solo tiene 0/1, se considera su primera vez
    return historialPaciente.length <= 1;
  };

  const todayIso = getLocalTodayStr();

  const citasDeHoy = sortCitasByHour(
    appointments.filter((app: any) => {
      const isToday = app.fecha === todayIso;
      const status = (app.status || "").toLowerCase();
      const isFinished =
        status === "completada" ||
        status === "finalizada" ||
        status === "atendida";

      return isToday && !isFinished;
    }),
  );

  return {
    appointments,
    addAppointment: saveAppointment,
    saveAppointment,
    deleteAppointment,
    isFirstTimePatient, // <-- Exportamos la función lista para usarse donde lo necesites
    totalCitasHoy: citasDeHoy.length,
    proximoPaciente: citasDeHoy[0] || null,
  };
};
