import type { ReactNode } from "react";
import { useLicense } from "../../hooks/useLicense";
import { setLicenseReadOnly } from "../../utils/licenseGuard";

interface LicenseProviderProps {
  children: ReactNode;
}

export const LicenseProvider = ({ children }: LicenseProviderProps) => {
  const { isReadOnly } = useLicense();

  // El guard se actualiza durante el render para que ninguna acción posterior
  // pueda escribir antes de que la licencia sea evaluada.
  setLicenseReadOnly(isReadOnly);

  return <>{children}</>;
};
