import type { ReactNode } from "react";
import { Footer } from "./Footer";

interface PageShellProps {
  children: ReactNode;
}

export const PageShell = ({ children }: PageShellProps) => {
  return (
    <div
      data-page-shell=""
      className="mx-auto flex w-full flex-1 flex-col justify-between px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">{children}</div>
      <Footer />
    </div>
  );
};
