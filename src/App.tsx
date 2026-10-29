import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PatientsHub from "./pages/Patients";
import PatientRecords from "./pages/PatientRecords";
import Schedule from "./pages/Schedule";
import HospitalizationView from "./pages/HospitalizationView";
import { useAppointments } from "./hooks/useAppointments";
import { usePatients } from "./hooks/usePatients";
import AppLayout from "./components/common/AppLayout";

function App() {
  const { appointments, deleteAppointment, saveAppointment } =
    useAppointments();

  const { patients, deletePatient } = usePatients();

  const handleSaveConsultation = (updatedCita: any, shouldFinish?: boolean) => {
    saveAppointment(updatedCita);
    // El registro del paciente se maneja desde el ConsultationModal
    // cuando se finaliza la consulta (shouldFinish = true)
  };

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/pacientes"
          element={<PatientsHub patients={patients} />}
        />
        <Route
          path="/pacientes/fichas"
          element={
            <PatientRecords
              patients={patients}
              appointments={appointments}
              onDeletePatient={deletePatient}
            />
          }
        />
        <Route
          path="/pacientes/hospitalizados"
          element={<HospitalizationView />}
        />
        <Route
          path="/agenda"
          element={
            <Schedule
              citas={appointments}
              onSaveAppointment={saveAppointment}
              onDeleteAppointment={deleteAppointment}
              onSaveConsultation={handleSaveConsultation}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
