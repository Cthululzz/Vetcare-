import { useLocalStorage } from "./useLocalStorage";
import { CAMAS_HOSPITALIZACION } from "../constants/hospitalization";

// ============================================
// CAMAS FÍSICAS DEL ÁREA DE HOSPITALIZACIÓN
// ============================================
// La cantidad de camas es configurable: el listado de 10 es solo el valor
// inicial. La ocupación nunca se guarda aquí, se deriva de las internaciones.

const BEDS_KEY = "vet_hospital_beds";

const buildBedName = (beds: string[]): string => {
  const used = new Set(beds);
  let index = beds.length + 1;
  let candidate = `Cama ${String(index).padStart(2, "0")}`;

  while (used.has(candidate)) {
    index += 1;
    candidate = `Cama ${String(index).padStart(2, "0")}`;
  }

  return candidate;
};

export function useHospitalBeds() {
  const [beds, setBeds] = useLocalStorage<string[]>(
    BEDS_KEY,
    CAMAS_HOSPITALIZACION,
  );

  /**
   * Agrega una cama. Devuelve el nombre de la cama creada.
   */
  const addBed = (name?: string): string => {
    const trimmed = name?.trim();
    const candidate = trimmed || buildBedName(beds);

    if (!beds.includes(candidate)) {
      setBeds((prev) =>
        prev.includes(candidate) ? prev : [...prev, candidate],
      );
    }

    return candidate;
  };

  const removeBed = (bed: string) => {
    setBeds((prev) => prev.filter((item) => item !== bed));
  };

  return {
    beds,
    addBed,
    removeBed,
  };
}
