import type {
  EspecieMascota,
  SucursalId,
} from "../constants/appConstants";
import type { Owner, Patient } from "../types/patient";
import { normalizePhone } from "./phone";

// ============================================
// DETECCIÓN DE CLIENTES YA REGISTRADOS
// ============================================
// Busca en TODAS las sucursales sin filtrar. La regla fuerte es nombre exacto
// + teléfono normalizado; el correo y el teléfono suelto son sólo apoyo para
// mostrar candidatos, nunca para vincular automáticamente.

export interface ClientMatchInput {
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  petName: string;
  petBreed?: string;
  petSpecies?: EspecieMascota;
}

export interface ClientMatch {
  owner: Owner;
  confianza: "alta" | "media" | "baja";
  razon: "nombre_telefono" | "telefono" | "correo" | "nombre";
  mascotaCoincidente?: Patient;
  mascotaExacta: boolean;
}

const normalizeText = (value: string): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const ordenConfianza: Record<ClientMatch["confianza"], number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

export function findClientMatches(
  owners: Owner[],
  patients: Patient[],
  input: ClientMatchInput,
): ClientMatch[] {
  const telefono = normalizePhone(input.ownerPhone);
  const correo = normalizeText(input.ownerEmail ?? "");
  const nombre = normalizeText(input.ownerName);
  if (!telefono && !correo && !nombre) return [];

  const encontrados = new Map<string, ClientMatch>();

  const agregar = (
    owner: Owner,
    confianza: ClientMatch["confianza"],
    razon: ClientMatch["razon"],
  ) => {
    if (encontrados.has(owner.id)) return;

    const mascotas = patients.filter(
      (p) => p.ownerId === owner.id && p.isActive !== false,
    );
    const nombreMascota = normalizeText(input.petName);
    const porNombre = mascotas.filter(
      (p) => normalizeText(p.name) === nombreMascota,
    );
    const coincideDetalles = (p: Patient): boolean =>
      (!input.petSpecies || p.species === input.petSpecies) &&
      (!input.petBreed?.trim() ||
        normalizeText(p.breed ?? "") === normalizeText(input.petBreed));

    const exacta = porNombre.find(coincideDetalles);
    encontrados.set(owner.id, {
      owner,
      confianza,
      razon,
      mascotaCoincidente: exacta ?? porNombre[0],
      mascotaExacta: Boolean(exacta),
    });
  };

  if (telefono && nombre) {
    owners
      .filter(
        (o) =>
          normalizeText(o.name) === nombre &&
          normalizePhone(o.phone) === telefono,
      )
      .forEach((o) => agregar(o, "alta", "nombre_telefono"));
  }

  // Sólo se busca por señales más débiles si no hay una coincidencia fuerte.
  if (encontrados.size === 0) {
    if (telefono) {
      owners
        .filter((o) => normalizePhone(o.phone) === telefono)
        .forEach((o) => agregar(o, "media", "telefono"));
    }
    if (correo) {
      owners
        .filter((o) => normalizeText(o.email ?? "") === correo)
        .forEach((o) => agregar(o, "baja", "correo"));
    }
    if (nombre) {
      owners
        .filter((o) => normalizeText(o.name) === nombre)
        .forEach((o) => agregar(o, "baja", "nombre"));
    }
  }

  return [...encontrados.values()].sort(
    (a, b) => ordenConfianza[a.confianza] - ordenConfianza[b.confianza],
  );
}

/** Verdadero si la ficha todavía no se puede ver desde la sucursal destino. */
export function necesitaVinculo(
  owner: Pick<Owner, "sucursalId" | "sucursalesAcceso">,
  sucursalId: SucursalId,
): boolean {
  return (
    owner.sucursalId !== sucursalId &&
    !owner.sucursalesAcceso?.some(
      (vinculo) => vinculo.activo && vinculo.sucursalId === sucursalId,
    )
  );
}

export function sucursalesDelOwner(owner: Owner): SucursalId[] {
  return [
    owner.sucursalId,
    ...(owner.sucursalesAcceso ?? [])
      .filter((v) => v.activo)
      .map((v) => v.sucursalId),
  ].filter((sucursal, indice, lista) => lista.indexOf(sucursal) === indice);
}
