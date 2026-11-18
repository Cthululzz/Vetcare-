import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  BranchContext,
  useActiveBranchState,
} from "./branchScope";

// El proveedor vive aparte del contexto para que el hook `useBranchScope` no
// mezcle exports de componentes y de lógica en un mismo archivo.

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useActiveBranchState(user ?? {});

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}
