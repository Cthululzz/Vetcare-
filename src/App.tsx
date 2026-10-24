import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientRecords from "./pages/PatientRecords";
import Schedule from "./pages/Schedule/Schedule";
import HospitalizationView from "./pages/HospitalizationView";
import Login from "./pages/Login";
import AppLayout from "./components/common/AppLayout";
import { DevAuthBypass } from "./components/common/DevAuthBypass";
import { useAuth } from "./hooks/useAuth";
import type { ReactNode } from "react";

// ============================================
// COMPONENTE DE PROTECCIÓN DE RUTAS
// ============================================
interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  // Si el bypass de desarrollo está activo, siempre permitir acceso
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";

  if (bypassAuth) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ============================================
// APP PRINCIPAL
// ============================================
function App() {
  const { isAuthenticated } = useAuth();
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";

  return (
    <>
      {/* Auto-login automático en desarrollo */}
      <DevAuthBypass />

      <Routes>
        {/* Ruta pública: Login (se salta si bypass está activo) */}
        <Route
          path="/login"
          element={
            isAuthenticated || bypassAuth ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />

        {/* Rutas protegidas (o abiertas si bypass está activo) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/pacientes/fichas" element={<PatientRecords />} />
          <Route
            path="/pacientes/hospitalizados"
            element={<HospitalizationView />}
          />
          <Route path="/agenda" element={<Schedule />} />
        </Route>

        {/* Ruta catch-all */}
        <Route
          path="*"
          element={
            <Navigate
              to={isAuthenticated || bypassAuth ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
