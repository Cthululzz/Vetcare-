import { lazy } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Login from "./pages/Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const PatientRecords = lazy(() => import("./pages/PatientRecords"));
const ClinicalHistory = lazy(() => import("./pages/ClinicalHistory"));
const Schedule = lazy(() => import("./pages/Schedule/Schedule"));
const HospitalizationView = lazy(() => import("./pages/HospitalizationView"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Configuration = lazy(() => import("./pages/Configuration"));
const ProviderConsole = lazy(() => import("./pages/ProviderConsole"));
const Reports = lazy(() => import("./pages/Reports"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
import AppLayout from "./components/common/AppLayout";
import { DevAuthBypass } from "./components/common/DevAuthBypass";
import { ActivationScreen } from "./components/license/ActivationScreen";
import { LicenseBlockedScreen } from "./components/license/LicenseBlockedScreen";
import { LicenseProvider } from "./components/license/LicenseProvider";
import { SetupScreen } from "./components/setup/SetupScreen";
import { useAuth } from "./hooks/useAuth";
import { useLicense } from "./hooks/useLicense";
import { useUsers } from "./hooks/useUsers";
import { usePermissions } from "./hooks/usePermissions";
import { PERMISSIONS, type Permission } from "./utils/permissions";
import { isBypassAuthEnabled } from "./utils/authBypass";
import type { ReactNode } from "react";

// ============================================
// COMPONENTE DE PROTECCIÓN DE RUTAS
// ============================================
interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  const bypassAuth = isBypassAuthEnabled();

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
  permission: Permission | Permission[];
  children: ReactNode;
}) {
  const { canAny } = usePermissions();
  const permitido = Array.isArray(permission)
    ? canAny(permission)
    : canAny([permission]);

  if (!permitido) {
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

function HomeRoute() {
  const { user } = useAuth();
  return user?.role === "PROVEEDOR" ? (
    <Navigate to="/proveedor" replace />
  ) : (
    <Dashboard />
  );
}

// ============================================
// APP PRINCIPAL
// ============================================
function App() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const bypassAuth = isBypassAuthEnabled();
  const { isActivated, isBloqueado } = useLicense();
  const { hasUsers } = useUsers();
  const esProveedor = user?.role === "PROVEEDOR";
  const enLogin = location.pathname === "/login";

  if (!bypassAuth && !isActivated && !enLogin) {
    return (
      <>
        <DevAuthBypass />
        <ActivationScreen />
      </>
    );
  }

  if (!bypassAuth && isActivated && isBloqueado && !esProveedor && !enLogin) {
    return (
      <>
        <DevAuthBypass />
        <LicenseBlockedScreen />
      </>
    );
  }

  if (!bypassAuth && isActivated && !hasUsers && !esProveedor && !enLogin) {
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
            <Route path="/" element={<HomeRoute />} />
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
            <Route path="/mi-cuenta" element={<MyAccount />} />
            <Route
              path="/recetas"
              element={
                <RequirePermission
                  permission={PERMISSIONS.CLINICAL_HISTORY_VIEW}
                >
                  <Prescriptions />
                </RequirePermission>
              }
            />
            <Route
              path="/reportes"
              element={
                <RequirePermission permission={PERMISSIONS.REPORTS_VIEW}>
                  <Reports />
                </RequirePermission>
              }
            />
            <Route
              path="/configuracion"
              element={
                <RequirePermission
                  permission={[
                    PERMISSIONS.SYSTEM_ADMIN,
                    PERMISSIONS.LICENSE_MANAGE,
                  ]}
                >
                  <Configuration />
                </RequirePermission>
              }
            />
            <Route
              path="/proveedor"
              element={
                <RequirePermission permission={PERMISSIONS.LICENSE_MANAGE}>
                  <ProviderConsole />
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
