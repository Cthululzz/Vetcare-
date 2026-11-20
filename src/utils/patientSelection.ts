import { getEspecieLabel } from "../constants/appConstants";
import type { Owner, Patient } from "../types/patient";

/** Valor del option que indica que se quiere registrar una mascota nueva. */
export const NEW_PATIENT_OPTION = "__new_patient__";

/**
 * Etiqueta de una mascota en el selector del formulario de citas.
 *
 * - Si dos mascotas del mismo dueño tienen el mismo nombre, se agrega la
 *   especie y la raza entre paréntesis.
 * - Si el nombre se repite entre dueños distintos, se agrega el teléfono del
 *   dueño para poder diferenciarlas.
 */
export const buildPetOptionLabel = (
  pet: Patient,
  mascotas: Patient[],
  dueno?: Owner,
): string => {
  const nombre = pet.name.trim().toLowerCase();
  const repetidas = mascotas.filter(
    (p) => p.name.trim().toLowerCase() === nombre,
  );

  const mismoDueno = repetidas.filter((p) => p.ownerId === pet.ownerId).length;
  const otroDueno = repetidas.some((p) => p.ownerId !== pet.ownerId);

  const detalles: string[] = [];
  if (mismoDueno > 1) {
    const raza = pet.breed?.trim();
    detalles.push(`${getEspecieLabel(pet.species)}${raza ? `, ${raza}` : ""}`);
  }
  if (otroDueno && dueno?.phone?.trim()) {
    detalles.push(`Tel. ${dueno.phone.trim()}`);
  }

  if (detalles.length === 0) return pet.name;
  return `${pet.name} (${detalles.join(" · ")})`;
};
