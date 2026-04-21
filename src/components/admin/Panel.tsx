import * as React from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  pad?: boolean;
  children: React.ReactNode;
}

export function Panel({
  title,
  subtitle,
  actions,
  pad = true,
  children,
  className,
  ...rest
}: PanelProps) {
  const hasHeader = title || actions;
  return (
    <section
      className={cn(
        "bg-surface-panel border border-line rounded-[var(--radius-admin-2xl)] overflow-hidden",
        className,
      )}
      {...rest}
    >
      {hasHeader && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            {title && (
              <div className="text-[13px] font-medium text-ink leading-tight">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[12px] text-ink-muted mt-0.5 leading-tight">
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}
