// src/hooks/usePatientProfiles.ts
import { useState, useEffect } from "react";

export interface PatientProfile {
  patientName: string;
  ownerName: string;
  condicionesPrevias: string;
  edad?: string;
  peso?: string;
  updatedAt: string;
}

const STORAGE_KEY = "vet_patient_profiles";

export const usePatientProfiles = () => {
  const [profiles, setProfiles] = useState<PatientProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  const getProfile = (
    patientName: string,
    ownerName: string,
  ): PatientProfile | null => {
    if (!patientName || !ownerName) return null;
    const normPatient = patientName.trim().toLowerCase();
    const normOwner = ownerName.trim().toLowerCase();

    return (
      profiles.find(
        (p) =>
          p.patientName.trim().toLowerCase() === normPatient &&
          p.ownerName.trim().toLowerCase() === normOwner,
      ) || null
    );
  };

  const saveProfile = (
    patientName: string,
    ownerName: string,
    condicionesPrevias: string,
    extraData?: { edad?: string; peso?: string },
  ) => {
    if (!patientName || !ownerName) return;

    const normPatient = patientName.trim();
    const normOwner = ownerName.trim();

    setProfiles((prev) => {
      const index = prev.findIndex(
        (p) =>
          p.patientName.trim().toLowerCase() === normPatient.toLowerCase() &&
          p.ownerName.trim().toLowerCase() === normOwner.toLowerCase(),
      );

      const updatedProfile: PatientProfile = {
        patientName: normPatient,
        ownerName: normOwner,
        condicionesPrevias,
        edad: extraData?.edad,
        peso: extraData?.peso,
        updatedAt: new Date().toISOString(),
      };

      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updatedProfile };
        return updated;
      } else {
        return [updatedProfile, ...prev];
      }
    });
  };

  return {
    profiles,
    getProfile,
    saveProfile,
  };
};
