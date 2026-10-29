import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PatientsHub from "./pages/Patients";
import PatientRecords from "./pages/PatientRecords";
import Schedule from "./pages/Schedule";
import HospitalizationView from "./pages/HospitalizationView";
import AppLayout from "./components/common/AppLayout";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pacientes" element={<PatientsHub />} />
        <Route path="/pacientes/fichas" element={<PatientRecords />} />
        <Route
          path="/pacientes/hospitalizados"
          element={<HospitalizationView />}
        />
        <Route path="/agenda" element={<Schedule />} />
      </Route>
    </Routes>
  );
}

export default App;
