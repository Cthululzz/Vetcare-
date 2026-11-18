import { Routes, Route, Navigate, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientRecords from "./pages/PatientRecords";
import ClinicalHistory from "./pages/ClinicalHistory";
import Schedule from "./pages/Schedule/Schedule";
import HospitalizationView from "./pages/HospitalizationView";
import Inventory from "./pages/Inventory"; // ← AGREGAR
import Tasks from "./pages/Tasks";
import Configuration from "./pages/Configuration";
import Login from "./pages/Login";
import AppLayout from "./components/common/AppLayout";
import { DevAuthBypass } from "./components/common/DevAuthBypass";
import { ActivationScreen } from "./components/license/ActivationScreen";
import { LicenseProvider } from "./components/license/LicenseProvider";
import { SetupScreen } from "./components/setup/SetupScreen";
import { useAuth } from "./hooks/useAuth";
import { useLicense } from "./hooks/useLicense";
import { useUsers } from "./hooks/useUsers";
import { usePermissions } from "./hooks/usePermissions";
import { PERMISSIONS, type Permission } from "./utils/permissions";
import type { ReactNode } from "react";

// ============================================
// COMPONENTE DE PROTECCIÓN DE RUTAS
// ============================================
interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

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
// PERMISOS POR RUTA
// ============================================
function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <h1 className="text-2xl font-black text-white mb-2">Sin acceso</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Tu rol no tiene permiso para entrar a esta sección. Si necesitas
          acceso, contacta al administrador de la clínica.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-[#ece883] hover:bg-[#e4df68] text-slate-950 text-sm font-bold transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================
// APP PRINCIPAL
// ============================================
function App() {
  const { isAuthenticated } = useAuth();
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true";
  const { isActivated } = useLicense();
  const { hasUsers } = useUsers();

  if (!bypassAuth && !isActivated) {
    return (
      <>
        <DevAuthBypass />
        <ActivationScreen />
      </>
    );
  }

  if (!bypassAuth && isActivated && !hasUsers) {
    return (
      <>
        <DevAuthBypass />
        <SetupScreen />
      </>
    );
  }

  return (
    <>
      <DevAuthBypass />
      <LicenseProvider>
        <Routes>
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

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/pacientes"
              element={
                <RequirePermission permission={PERMISSIONS.PATIENTS_VIEW}>
                  <Patients />
                </RequirePermission>
              }
            />
            <Route
              path="/pacientes/fichas"
              element={
                <RequirePermission permission={PERMISSIONS.PATIENTS_VIEW}>
                  <PatientRecords />
                </RequirePermission>
              }
            />
            <Route
              path="/pacientes/:patientId/historial"
              element={
                <RequirePermission permission={PERMISSIONS.CLINICAL_HISTORY_VIEW}>
                  <ClinicalHistory />
                </RequirePermission>
              }
            />
            <Route
              path="/pacientes/hospitalizados"
              element={
                <RequirePermission permission={PERMISSIONS.CLINICAL_HISTORY_VIEW}>
                  <HospitalizationView />
                </RequirePermission>
              }
            />
            <Route
              path="/agenda"
              element={
                <RequirePermission permission={PERMISSIONS.APPOINTMENTS_VIEW}>
                  <Schedule />
                </RequirePermission>
              }
            />
            <Route
              path="/tareas"
              element={
                <RequirePermission permission={PERMISSIONS.CLINICAL_HISTORY_VIEW}>
                  <Tasks />
                </RequirePermission>
              }
            />
            <Route
              path="/inventario"
              element={
                <RequirePermission permission={PERMISSIONS.INVENTORY_VIEW}>
                  <Inventory />
                </RequirePermission>
              }
            />
            <Route
              path="/configuracion"
              element={
                <RequirePermission permission={PERMISSIONS.SYSTEM_ADMIN}>
                  <Configuration />
                </RequirePermission>
              }
            />
          </Route>

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
      </LicenseProvider>
    </>
  );
}

export default App;
