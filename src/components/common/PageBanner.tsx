import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PageBannerProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export const PageBanner = ({
  icon: Icon,
  title,
  description,
  actions,
}: PageBannerProps) => {
  return (
    <section
      data-page-banner=""
      className="relative min-h-[132px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm sm:p-8"
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 rounded-full bg-[#ece883]/5 blur-2xl" />
      <div className="relative z-10 flex min-h-[68px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            <Icon className="h-8 w-8 shrink-0 text-[#ece883]" />
            {title}
          </h1>
          {description ? (
            <div className="text-sm text-slate-400">{description}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
};
