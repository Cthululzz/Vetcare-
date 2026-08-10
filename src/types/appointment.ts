export interface Appointment {
  id: string;
  propietario: string;
  paciente: string;
  raza?: string;
  sucursal: string;
  doctor: string;
  fecha: string;
  hora: string;
  motivo: string;
  tipo: string;
  tipoMascota?: string;
  genero?: string;
  edad?: string;
  peso?: string;
  condicionesPrevias?: string;
  recomendaciones?: string;
  notas?: string;
}
