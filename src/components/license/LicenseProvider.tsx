import { useEffect, type ReactNode } from "react";
import { useLicense } from "../../hooks/useLicense";
import { setLicenseReadOnly } from "../../utils/licenseGuard";

interface LicenseProviderProps {
  children: ReactNode;
}

export const LicenseProvider = ({ children }: LicenseProviderProps) => {
  const { isReadOnly } = useLicense();

  useEffect(() => {
    setLicenseReadOnly(isReadOnly);
  }, [isReadOnly]);

  return <>{children}</>;
};
